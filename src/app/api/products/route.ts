import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeString, sanitizeNumber } from "@/lib/validate"
import { getSearchParams } from "@/lib/api-client"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const searchParams = getSearchParams(request.url)
  const search = searchParams.get("search") || ""
  const categoryId = searchParams.get("categoryId") || ""
  const activeOnly = searchParams.get("activeOnly") === "true"

  const where: Record<string, unknown> = {}
  if (search) {
    where.name = { contains: search }
  }
  if (categoryId) {
    where.categoryId = categoryId
  }
  if (activeOnly) {
    where.isActive = true
  }

  try {
    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json({ error: "Gagal memuat data produk" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  // Input validation
  const name = sanitizeString(body.name)
  if (!name || name.length < 1) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      name,
      description: sanitizeString(body.description),
      price: sanitizeNumber(body.price, 0),
      cost: sanitizeNumber(body.cost, 0),
      stock: sanitizeNumber(body.stock, 0, 999999),
      categoryId: sanitizeString(body.categoryId),
      isActive: body.isActive !== false,
    },
  })

  return NextResponse.json(product, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  const name = sanitizeString(body.name)
  if (!name || name.length < 1) {
    return NextResponse.json({ error: "Product name is required" }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id: sanitizeString(body.id) },
    data: {
      name,
      description: sanitizeString(body.description),
      price: sanitizeNumber(body.price, 0),
      cost: sanitizeNumber(body.cost, 0),
      stock: sanitizeNumber(body.stock, 0, 999999),
      categoryId: sanitizeString(body.categoryId),
      isActive: body.isActive !== false,
    },
  })

  return NextResponse.json(product)
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
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Product has transactions" }, { status: 400 })
  }
}
