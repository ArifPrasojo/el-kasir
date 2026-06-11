import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString } from "@/lib/validate"
import { auditLog } from "@/lib/audit"
import { getSearchParams } from "@/lib/api-client"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Ambil suppliers dulu
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: { select: { purchaseOrders: true } },
        branch: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    })

    // Ambil supplierMaterials terpisah untuk menghindari nested include issue
    const supplierIds = suppliers.map((s) => s.id)
    const supplierMaterials = supplierIds.length > 0
      ? await prisma.supplierMaterial.findMany({
          where: { supplierId: { in: supplierIds } },
          include: {
            rawMaterial: { select: { id: true, name: true, unit: true, stock: true } },
          },
        })
      : []

    // Gabungkan manual
    const result = suppliers.map((s) => ({
      ...s,
      supplierMaterials: supplierMaterials.filter((sm) => sm.supplierId === s.id),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/suppliers]", error)
    return NextResponse.json(
      { error: "Gagal memuat data supplier", detail: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const name = sanitizeString(body.name)
    if (!name) return NextResponse.json({ error: "Nama supplier wajib diisi" }, { status: 400 })

    const materialLinks: { rawMaterialId: string; pricePerUnit: number }[] = (body.materials || [])
      .map((m: { rawMaterialId: string; pricePerUnit: number }) => ({
        rawMaterialId: sanitizeString(m.rawMaterialId),
        pricePerUnit: Number(m.pricePerUnit) || 0,
      }))
      .filter((m: { rawMaterialId: string }) => !!m.rawMaterialId)

    // Buat supplier dulu
    const supplier = await prisma.supplier.create({
      data: {
        name,
        email: sanitizeString(body.email),
        phone: sanitizeString(body.phone),
        address: sanitizeString(body.address),
        branchId: body.branchId || null,
      },
    })

    // Buat supplierMaterials secara terpisah
    if (materialLinks.length > 0) {
      await prisma.supplierMaterial.createMany({
        data: materialLinks.map((m) => ({
          supplierId: supplier.id,
          rawMaterialId: m.rawMaterialId,
          pricePerUnit: m.pricePerUnit,
        })),
        skipDuplicates: true,
      })
    }

    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "CREATE", entity: "Supplier", entityId: supplier.id,
      details: `Created supplier: ${name} with ${materialLinks.length} materials`, request,
    })

    // Return dengan materials
    const withMaterials = await prisma.supplierMaterial.findMany({
      where: { supplierId: supplier.id },
      include: { rawMaterial: { select: { id: true, name: true, unit: true } } },
    })

    return NextResponse.json({ ...supplier, supplierMaterials: withMaterials }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/suppliers]", error)
    return NextResponse.json({ error: "Gagal membuat supplier", detail: String(error) }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const id = sanitizeString(body.id)
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    const materialLinks: { rawMaterialId: string; pricePerUnit: number }[] = (body.materials || [])
      .map((m: { rawMaterialId: string; pricePerUnit: number }) => ({
        rawMaterialId: sanitizeString(m.rawMaterialId),
        pricePerUnit: Number(m.pricePerUnit) || 0,
      }))
      .filter((m: { rawMaterialId: string }) => !!m.rawMaterialId)

    // Update supplier info
    await prisma.supplier.update({
      where: { id },
      data: {
        name: sanitizeString(body.name),
        email: sanitizeString(body.email),
        phone: sanitizeString(body.phone),
        address: sanitizeString(body.address),
        branchId: body.branchId || null,
        isActive: body.isActive !== false,
      },
    })

    // Replace materials: delete lama, buat baru
    await prisma.supplierMaterial.deleteMany({ where: { supplierId: id } })
    if (materialLinks.length > 0) {
      await prisma.supplierMaterial.createMany({
        data: materialLinks.map((m) => ({
          supplierId: id,
          rawMaterialId: m.rawMaterialId,
          pricePerUnit: m.pricePerUnit,
        })),
        skipDuplicates: true,
      })
    }

    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "UPDATE", entity: "Supplier", entityId: id,
      details: `Updated supplier with ${materialLinks.length} materials`, request,
    })

    const supplier = await prisma.supplier.findUnique({ where: { id } })
    const withMaterials = await prisma.supplierMaterial.findMany({
      where: { supplierId: id },
      include: { rawMaterial: { select: { id: true, name: true, unit: true } } },
    })

    return NextResponse.json({ ...supplier, supplierMaterials: withMaterials })
  } catch (error) {
    console.error("[PUT /api/suppliers]", error)
    return NextResponse.json({ error: "Gagal update supplier", detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = getSearchParams(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

    // Cek apakah supplier masih punya PO aktif
    const activePO = await prisma.purchaseOrder.findFirst({
      where: { supplierId: id, status: { in: ["DRAFT", "SENT"] } },
    })
    if (activePO) {
      return NextResponse.json({ error: "Supplier masih memiliki Purchase Order aktif" }, { status: 400 })
    }

    // Hapus materials + supplier dalam satu transaction (atomic)
    await prisma.$transaction(async (tx) => {
      await tx.supplierMaterial.deleteMany({ where: { supplierId: id } })
      await tx.supplier.delete({ where: { id } })
    })

    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "DELETE", entity: "Supplier", entityId: id, request,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/suppliers]", error)
    // Cek jika foreign key constraint (masih ada PO completed/cancelled)
    const msg = String(error)
    if (msg.includes("foreign key") || msg.includes("constraint")) {
      return NextResponse.json({ error: "Supplier masih memiliki riwayat Purchase Order" }, { status: 400 })
    }
    return NextResponse.json({ error: "Gagal menghapus supplier" }, { status: 500 })
  }
}
