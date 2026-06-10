import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString, sanitizeNumber } from "@/lib/validate"
import { auditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const id = searchParams.get("id")

  if (id) {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, supplier: true, creator: { select: { name: true } }, branch: { select: { name: true } } },
    })
    return NextResponse.json(po)
  }

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const pos = await prisma.purchaseOrder.findMany({
    where,
    include: { supplier: true, creator: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(pos)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = (session.user as { id: string }).id

  // Generate PO number
  const now = new Date()
  const count = await prisma.purchaseOrder.count({
    where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) } },
  })
  const poNumber = `PO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`

  const items = (body.items || []).map((item: { productId: string; quantity: number; cost: number }) => ({
    productId: sanitizeString(item.productId),
    quantity: sanitizeNumber(item.quantity, 1),
    cost: sanitizeNumber(item.cost, 0),
    subtotal: sanitizeNumber(item.quantity, 1) * sanitizeNumber(item.cost, 0),
  }))

  const totalAmount = items.reduce((sum: number, item: { subtotal: number }) => sum + item.subtotal, 0)

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: sanitizeString(body.supplierId),
      branchId: body.branchId || null,
      status: "DRAFT",
      totalAmount,
      notes: sanitizeString(body.notes),
      createdBy: userId,
      items: { create: items },
    },
    include: { items: true, supplier: true },
  })

  await auditLog({
    userId, action: "CREATE", entity: "PurchaseOrder", entityId: po.id,
    details: `Created PO: ${poNumber}, total: ${totalAmount}`, request,
  })

  return NextResponse.json(po, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = (session.user as { id: string }).id
  const newStatus = body.status

  // If status changes to RECEIVED, update stock
  if (newStatus === "RECEIVED") {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: body.id },
      include: { items: true },
    })
    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })
    if (po.status === "RECEIVED") return NextResponse.json({ error: "PO already received" }, { status: 400 })

    await prisma.$transaction(async (tx) => {
      // Update stock for each item
      for (const item of po.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity }, cost: item.cost },
        })
      }
      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: body.id },
        data: { status: "RECEIVED", receivedAt: new Date() },
      })
    })

    await auditLog({
      userId, action: "RECEIVE", entity: "PurchaseOrder", entityId: body.id,
      details: `Received PO: ${po.poNumber}`, request,
    })
  } else {
    await prisma.purchaseOrder.update({
      where: { id: body.id },
      data: { status: newStatus, notes: sanitizeString(body.notes) },
    })
  }

  const updated = await prisma.purchaseOrder.findUnique({
    where: { id: body.id },
    include: { items: { include: { product: true } }, supplier: true },
  })

  return NextResponse.json(updated)
}
