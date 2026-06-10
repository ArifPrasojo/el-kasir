import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString } from "@/lib/validate"
import { getSearchParams } from "@/lib/api-client"

type SessionUser = { id: string; role: string; branchId?: string }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sessionUser = session.user as SessionUser
    const isAdmin = sessionUser.role === "ADMIN"

    const where = isAdmin
      ? {}
      : sessionUser.branchId
      ? { branchId: sessionUser.branchId }
      : {}

    const searchParams = getSearchParams(request.url)
    const search = searchParams.get("search")
    if (search) {
      Object.assign(where, {
        name: { contains: search, mode: "insensitive" },
      })
    }

    const customers = await prisma.customer.findMany({
      where,
      include: { _count: { select: { transactions: true } }, branch: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(customers)
  } catch (error) {
    console.error("GET /api/customers error:", error)
    return NextResponse.json({ error: "Gagal memuat data customer" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessionUser = session.user as SessionUser
  const body = await request.json()
  const name = sanitizeString(body.name)
  if (!name) return NextResponse.json({ error: "Nama customer wajib diisi" }, { status: 400 })

  try {
    const customer = await prisma.customer.create({
      data: {
        name,
        phone: sanitizeString(body.phone),
        email: sanitizeString(body.email),
        // Kasir otomatis assign ke cabangnya
        branchId: body.branchId || sessionUser.branchId || null,
      },
    })
    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error("POST /api/customers error:", error)
    return NextResponse.json({ error: "Gagal menambahkan customer" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  try {
    const customer = await prisma.customer.update({
      where: { id: sanitizeString(body.id) },
      data: {
        name: sanitizeString(body.name),
        phone: sanitizeString(body.phone),
        email: sanitizeString(body.email),
      },
    })
    return NextResponse.json(customer)
  } catch (error) {
    console.error("PUT /api/customers error:", error)
    return NextResponse.json({ error: "Gagal mengupdate customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const sessionUser = session.user as SessionUser
  if (sessionUser.role !== "ADMIN") {
    return NextResponse.json({ error: "Hanya admin yang bisa menghapus customer" }, { status: 403 })
  }

  const searchParams = getSearchParams(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Customer masih memiliki transaksi" }, { status: 400 })
  }
}
