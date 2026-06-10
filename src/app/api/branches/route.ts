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
    const branches = await prisma.branch.findMany({
      include: { _count: { select: { users: true, products: true, transactions: true } } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(branches)
  } catch (error) {
    console.error("GET /api/branches error:", error)
    return NextResponse.json({ error: "Gagal memuat data cabang" }, { status: 500 })
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
  if (!name) return NextResponse.json({ error: "Nama cabang wajib diisi" }, { status: 400 })

  try {
    const branch = await prisma.branch.create({
      data: {
        name,
        address: sanitizeString(body.address),
        phone: sanitizeString(body.phone),
        isActive: body.isActive !== false,
      },
    })

    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "CREATE", entity: "Branch", entityId: branch.id,
      details: `Created branch: ${name}`, request,
    })

    return NextResponse.json(branch, { status: 201 })
  } catch (error) {
    console.error("POST /api/branches error:", error)
    return NextResponse.json({ error: "Gagal menambahkan cabang" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  try {
    const branch = await prisma.branch.update({
      where: { id: sanitizeString(body.id) },
      data: {
        name: sanitizeString(body.name),
        address: sanitizeString(body.address),
        phone: sanitizeString(body.phone),
        isActive: body.isActive !== false,
      },
    })

    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "UPDATE", entity: "Branch", entityId: branch.id,
      details: `Updated branch: ${branch.name}`, request,
    })

    return NextResponse.json(branch)
  } catch (error) {
    console.error("PUT /api/branches error:", error)
    return NextResponse.json({ error: "Gagal mengupdate cabang" }, { status: 500 })
  }
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
    await prisma.branch.delete({ where: { id } })
    await auditLog({
      userId: (session.user as { id: string }).id,
      action: "DELETE", entity: "Branch", entityId: id, request,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Cabang masih memiliki data terkait" }, { status: 400 })
  }
}
