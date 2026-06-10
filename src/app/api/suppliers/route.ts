import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString } from "@/lib/validate"
import { auditLog } from "@/lib/audit"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { purchaseOrders: true } }, branch: { select: { name: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(suppliers)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const name = sanitizeString(body.name)
  if (!name) return NextResponse.json({ error: "Nama supplier wajib diisi" }, { status: 400 })

  const supplier = await prisma.supplier.create({
    data: {
      name,
      email: sanitizeString(body.email),
      phone: sanitizeString(body.phone),
      address: sanitizeString(body.address),
      branchId: body.branchId || null,
    },
  })

  await auditLog({
    userId: (session.user as { id: string }).id,
    action: "CREATE", entity: "Supplier", entityId: supplier.id,
    details: `Created supplier: ${name}`, request,
  })

  return NextResponse.json(supplier, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const supplier = await prisma.supplier.update({
    where: { id: sanitizeString(body.id) },
    data: {
      name: sanitizeString(body.name),
      email: sanitizeString(body.email),
      phone: sanitizeString(body.phone),
      address: sanitizeString(body.address),
      branchId: body.branchId || null,
      isActive: body.isActive !== false,
    },
  })

  await auditLog({
    userId: (session.user as { id: string }).id,
    action: "UPDATE", entity: "Supplier", entityId: supplier.id, request,
  })

  return NextResponse.json(supplier)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    await prisma.supplier.delete({ where: { id } })
    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "DELETE", entity: "Supplier", entityId: id, request,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Supplier masih memiliki Purchase Order" }, { status: 400 })
  }
}
