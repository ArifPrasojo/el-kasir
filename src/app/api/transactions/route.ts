import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")
  const id = searchParams.get("id")

  if (id) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, user: true },
    })
    return NextResponse.json(transaction)
  }

  const where: Record<string, unknown> = {}
  if (dateFrom && dateTo) {
    where.createdAt = {
      gte: new Date(dateFrom),
      lte: new Date(dateTo + "T23:59:59"),
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { user: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(transactions)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = (session.user as { id: string }).id

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
    // Validate stock and create items
    const items = []
    for (const item of body.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new Error(`Product not found: ${item.productId}`)
      if (product.stock < item.quantity) throw new Error(`Insufficient stock: ${product.name}`)

      // Reduce stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })

      items.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: product.price * item.quantity,
      })
    }

    return tx.transaction.create({
      data: {
        transactionNumber,
        totalAmount: body.totalAmount,
        paymentAmount: body.paymentAmount,
        changeAmount: body.changeAmount,
        userId,
        items: { create: items },
      },
      include: { items: true, user: true },
    })
  })

  return NextResponse.json(transaction, { status: 201 })
}
