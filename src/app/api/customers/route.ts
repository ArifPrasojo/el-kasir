import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString } from "@/lib/validate"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const customers = await prisma.customer.findMany({
    include: { _count: { select: { transactions: true } }, branch: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(customers)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const name = sanitizeString(body.name)
  if (!name) return NextResponse.json({ error: "Nama customer wajib diisi" }, { status: 400 })

  const customer = await prisma.customer.create({
    data: {
      name,
      phone: sanitizeString(body.phone),
      email: sanitizeString(body.email),
      branchId: body.branchId || null,
    },
  })
  return NextResponse.json(customer, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const customer = await prisma.customer.update({
    where: { id: sanitizeString(body.id) },
    data: {
      name: sanitizeString(body.name),
      phone: sanitizeString(body.phone),
      email: sanitizeString(body.email),
    },
  })
  return NextResponse.json(customer)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Customer masih memiliki transaksi" }, { status: 400 })
  }
}
