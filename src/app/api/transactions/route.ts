import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSearchParams } from "@/lib/api-client"

type SessionUser = { id: string; role: string; branchId?: string }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sessionUser = session.user as SessionUser
    const isAdmin = sessionUser.role === "ADMIN"

    const searchParams = getSearchParams(request.url)
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const id = searchParams.get("id")
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "100", 10)))
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const skip = (page - 1) * limit

    if (id) {
      const where = isAdmin
        ? { id }
        : { id, userId: sessionUser.id }

      const transaction = await prisma.transaction.findFirst({
        where,
        include: { items: { include: { product: true } }, user: true, customer: true },
      })
      if (!transaction) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json(transaction)
    }

    const where: Record<string, unknown> = isAdmin ? {} : { userId: sessionUser.id }

    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo + "T23:59:59"),
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { name: true } },
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error("GET /api/transactions error:", error)
    return NextResponse.json({ error: "Gagal memuat data transaksi" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sessionUser = session.user as SessionUser
    const body = await request.json()

    // Validate request body
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Keranjang tidak boleh kosong" }, { status: 400 })
    }
    if (body.paymentAmount === undefined || typeof body.paymentAmount !== "number" || body.paymentAmount < 0) {
      return NextResponse.json({ error: "Jumlah pembayaran tidak valid" }, { status: 400 })
    }

    // Generate transaction number
    const now = new Date()
    const txCount = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(now.toISOString().split("T")[0]),
        },
      },
    })
    const transactionNumber = `TRX${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(txCount + 1).padStart(4, "0")}`

    // Create transaction with items and update stock
    const transaction = await prisma.$transaction(async (tx) => {
      const items = []
      let serverTotalAmount = 0
      for (const item of body.items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new Error("Item tidak valid")
        }
        const product = await tx.product.findUnique({ where: { id: item.productId } })
        if (!product) throw new Error(`Produk tidak ditemukan: ${item.productId}`)
        if (!product.isActive) throw new Error(`Produk tidak aktif: ${product.name}`)
        if (product.stock < item.quantity) throw new Error(`Stok tidak cukup: ${product.name} (tersedia: ${product.stock}, diminta: ${item.quantity})`)

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })

        // Hitung subtotal dari harga di database — jangan percaya harga dari client
        const subtotal = product.price * Math.floor(item.quantity)
        serverTotalAmount += subtotal

        items.push({
          productId: item.productId,
          productName: product.name,
          quantity: Math.floor(item.quantity),
          price: product.price,
          subtotal,
        })
      }

      // Validasi pembayaran berdasarkan total hasil hitung server
      if (body.paymentAmount < serverTotalAmount) {
        throw new Error("Jumlah pembayaran tidak mencukupi")
      }

      // Update customer spending if customerId provided
      if (body.customerId) {
        try {
          await tx.customer.update({
            where: { id: body.customerId },
            data: {
              totalSpent: { increment: serverTotalAmount },
              totalPoints: { increment: Math.floor(serverTotalAmount / 1000) },
            },
          })
        } catch {
          // Customer might not exist, skip
          console.warn("Customer update skipped: customer not found", body.customerId)
        }
      }

      const allowedPaymentMethods = ["CASH", "QRIS", "DEBIT", "TRANSFER"]
      const paymentMethod = allowedPaymentMethods.includes(body.paymentMethod)
        ? body.paymentMethod
        : "CASH"

      return tx.transaction.create({
        data: {
          transactionNumber,
          totalAmount: serverTotalAmount,
          paymentAmount: paymentMethod === "CASH" ? body.paymentAmount : serverTotalAmount,
          // Hitung changeAmount di server — jangan percaya nilai dari client (non-CASH = 0)
          changeAmount: paymentMethod === "CASH" ? Math.max(0, body.paymentAmount - serverTotalAmount) : 0,
          paymentMethod,
          userId: sessionUser.id,
          branchId: sessionUser.branchId ?? null,
          customerId: body.customerId ?? null,
          items: { create: items },
        },
        include: { items: true, user: true, customer: true },
      })
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error("POST /api/transactions error:", error)
    const message = error instanceof Error ? error.message : "Gagal memproses transaksi"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
