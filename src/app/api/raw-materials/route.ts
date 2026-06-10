import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString, sanitizeNumber } from "@/lib/validate"
import { getSearchParams } from "@/lib/api-client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const materials = await prisma.rawMaterial.findMany({
      include: { branch: { select: { name: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(materials)
  } catch (error) {
    console.error("GET /api/raw-materials error:", error)
    return NextResponse.json({ error: "Gagal memuat data bahan baku" }, { status: 500 })
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
  if (!name) return NextResponse.json({ error: "Nama bahan baku wajib diisi" }, { status: 400 })

  const material = await prisma.rawMaterial.create({
    data: {
      name,
      unit: sanitizeString(body.unit) || "pcs",
      stock: sanitizeNumber(body.stock, 0),
      costPerUnit: sanitizeNumber(body.costPerUnit, 0),
      minStock: sanitizeNumber(body.minStock, 0),
      branchId: body.branchId || null,
    },
  })
  return NextResponse.json(material, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const material = await prisma.rawMaterial.update({
    where: { id: sanitizeString(body.id) },
    data: {
      name: sanitizeString(body.name),
      unit: sanitizeString(body.unit) || "pcs",
      stock: sanitizeNumber(body.stock, 0),
      costPerUnit: sanitizeNumber(body.costPerUnit, 0),
      minStock: sanitizeNumber(body.minStock, 0),
      branchId: body.branchId || null,
      isActive: body.isActive !== false,
    },
  })
  return NextResponse.json(material)
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
    await prisma.rawMaterial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Bahan baku masih digunakan di Purchase Order" }, { status: 400 })
  }
}
