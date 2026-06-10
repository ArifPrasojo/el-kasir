import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString } from "@/lib/validate"
import { auditLog } from "@/lib/audit"
import { getSearchParams } from "@/lib/api-client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: { select: { purchaseOrders: true } },
        branch: { select: { name: true } },
        supplierMaterials: {
          include: {
            rawMaterial: { select: { id: true, name: true, unit: true, stock: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error("GET /api/suppliers error:", error)
    return NextResponse.json({ error: "Gagal memuat data supplier" }, { status: 500 })
  }
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

  // materialIds: array of { rawMaterialId, pricePerUnit }
  const materialLinks: { rawMaterialId: string; pricePerUnit: number }[] = (body.materials || []).map(
    (m: { rawMaterialId: string; pricePerUnit: number }) => ({
      rawMaterialId: sanitizeString(m.rawMaterialId),
      pricePerUnit: Number(m.pricePerUnit) || 0,
    })
  ).filter((m: { rawMaterialId: string }) => m.rawMaterialId)

  const supplier = await prisma.supplier.create({
    data: {
      name,
      email: sanitizeString(body.email),
      phone: sanitizeString(body.phone),
      address: sanitizeString(body.address),
      branchId: body.branchId || null,
      supplierMaterials: materialLinks.length > 0
        ? { create: materialLinks }
        : { create: [] },
    },
    include: {
      supplierMaterials: { include: { rawMaterial: { select: { id: true, name: true, unit: true } } } },
    },
  })

  await auditLog({
    userId: (session.user as { id: string }).id,
    action: "CREATE", entity: "Supplier", entityId: supplier.id,
    details: `Created supplier: ${name} with ${materialLinks.length} materials`, request,
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
  const id = sanitizeString(body.id)
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  const materialLinks: { rawMaterialId: string; pricePerUnit: number }[] = (body.materials || []).map(
    (m: { rawMaterialId: string; pricePerUnit: number }) => ({
      rawMaterialId: sanitizeString(m.rawMaterialId),
      pricePerUnit: Number(m.pricePerUnit) || 0,
    })
  ).filter((m: { rawMaterialId: string }) => m.rawMaterialId)

  // Replace all supplierMaterials: delete old, create new
  await prisma.$transaction(async (tx) => {
    await tx.supplierMaterial.deleteMany({ where: { supplierId: id } })
    await tx.supplier.update({
      where: { id },
      data: {
        name: sanitizeString(body.name),
        email: sanitizeString(body.email),
        phone: sanitizeString(body.phone),
        address: sanitizeString(body.address),
        branchId: body.branchId || null,
        isActive: body.isActive !== false,
        ...(materialLinks.length > 0 ? { supplierMaterials: { create: materialLinks } } : {}),
      },
    })
  })

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      supplierMaterials: { include: { rawMaterial: { select: { id: true, name: true, unit: true } } } },
    },
  })

  await auditLog({
    userId: (session.user as { id: string }).id,
    action: "UPDATE", entity: "Supplier", entityId: id,
    details: `Updated supplier with ${materialLinks.length} materials`, request,
  })

  return NextResponse.json(supplier)
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const searchParams = getSearchParams(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    // supplierMaterials ter-cascade delete karena onDelete: Cascade di schema
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
