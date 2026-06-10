import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString, sanitizeNumber } from "@/lib/validate"
import { auditLog } from "@/lib/audit"
import { getSearchParams } from "@/lib/api-client"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const searchParams = getSearchParams(request.url)
    const status = searchParams.get("status")
    const id = searchParams.get("id")
    const supplierId = searchParams.get("supplierId")

    if (supplierId) {
      const materials = await prisma.supplierMaterial.findMany({
        where: { supplierId },
        include: {
          rawMaterial: { select: { id: true, name: true, unit: true, stock: true, costPerUnit: true } },
        },
        orderBy: { rawMaterial: { name: "asc" } },
      })
      return NextResponse.json(materials)
    }

    if (id) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          items: { include: { rawMaterial: true } },
          supplier: true,
          creator: { select: { name: true } },
          branch: { select: { name: true } },
        },
      })
      if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })
      return NextResponse.json(po)
    }

    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const pos = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        creator: { select: { name: true } },
        branch: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(pos)
  } catch (error) {
    console.error("GET /api/purchase-orders error:", error)
    return NextResponse.json({ error: "Gagal memuat data purchase order" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = (session.user as { id: string }).id

  if (!body.supplierId) {
    return NextResponse.json({ error: "Supplier wajib dipilih" }, { status: 400 })
  }
  if (!body.items || body.items.length === 0) {
    return NextResponse.json({ error: "Minimal 1 bahan baku harus ditambahkan" }, { status: 400 })
  }

  // Generate PO number — pakai timestamp untuk menghindari race condition
  const now = new Date()
  const prefix = `PO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`
  const lastPO = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: "desc" },
  })
  let nextNum = 1
  if (lastPO) {
    const lastNum = parseInt(lastPO.poNumber.split("-")[1] || "0")
    nextNum = lastNum + 1
  }
  const poNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`

  // Build items
  const rawItems = (body.items as { rawMaterialId: string; quantity: number; cost: number }[])
    .filter((i) => i.rawMaterialId && i.quantity > 0)

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Item tidak valid" }, { status: 400 })
  }

  // Fetch material names
  const materialIds = rawItems.map((i) => i.rawMaterialId)
  const materials = await prisma.rawMaterial.findMany({
    where: { id: { in: materialIds } },
    select: { id: true, name: true },
  })
  const materialMap = new Map(materials.map((m) => [m.id, m.name]))

  const items = rawItems.map((item) => ({
    rawMaterialId: sanitizeString(item.rawMaterialId),
    itemName: materialMap.get(item.rawMaterialId) || "",
    quantity: sanitizeNumber(item.quantity, 1),
    cost: sanitizeNumber(item.cost, 0),
    subtotal: sanitizeNumber(item.quantity, 1) * sanitizeNumber(item.cost, 0),
  }))

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0)

  try {
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
      include: {
        items: { include: { rawMaterial: true } },
        supplier: true,
        creator: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })

    await auditLog({
      userId, action: "CREATE", entity: "PurchaseOrder", entityId: po.id,
      details: `Created PO: ${poNumber}, supplier: ${po.supplier.name}, ${items.length} items, total: ${totalAmount}`,
      request,
    })

    return NextResponse.json(po, { status: 201 })
  } catch (err) {
    console.error("PO create error:", err)
    return NextResponse.json({ error: "Gagal membuat Purchase Order" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const userId = (session.user as { id: string }).id
  const newStatus = body.status

  if (newStatus === "RECEIVED") {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: body.id },
      include: { items: true },
    })
    if (!po) return NextResponse.json({ error: "PO not found" }, { status: 404 })
    if (po.status === "RECEIVED") {
      return NextResponse.json({ error: "PO sudah pernah diterima" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      for (const item of po.items) {
        if (item.rawMaterialId) {
          await tx.rawMaterial.update({
            where: { id: item.rawMaterialId },
            data: {
              stock: { increment: item.quantity },
              costPerUnit: item.cost,
            },
          })
        }
      }
      await tx.purchaseOrder.update({
        where: { id: body.id },
        data: { status: "RECEIVED", receivedAt: new Date() },
      })
    })

    await auditLog({
      userId, action: "RECEIVE", entity: "PurchaseOrder", entityId: body.id,
      details: `PO diterima, stok bahan baku diperbarui (${po.items.length} item)`, request,
    })
  } else {
    if (!["SENT", "CANCELLED"].includes(newStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
    }
    await prisma.purchaseOrder.update({
      where: { id: body.id },
      data: { status: newStatus, notes: body.notes ? sanitizeString(body.notes) : undefined },
    })
    await auditLog({
      userId, action: "UPDATE", entity: "PurchaseOrder", entityId: body.id,
      details: `Status PO diubah ke ${newStatus}`, request,
    })
  }

  const updated = await prisma.purchaseOrder.findUnique({
    where: { id: body.id },
    include: {
      items: { include: { rawMaterial: true } },
      supplier: true,
      creator: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  return NextResponse.json(updated)
}
