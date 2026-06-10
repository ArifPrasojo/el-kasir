import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
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

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const product = await prisma.product.create({
    data: {
      name: body.name,
      description: body.description || "",
      price: parseFloat(body.price),
      cost: parseFloat(body.cost) || 0,
      stock: parseInt(body.stock) || 0,
      categoryId: body.categoryId,
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
  const product = await prisma.product.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description || "",
      price: parseFloat(body.price),
      cost: parseFloat(body.cost) || 0,
      stock: parseInt(body.stock) || 0,
      categoryId: body.categoryId,
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

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Product has transactions" }, { status: 400 })
  }
}
