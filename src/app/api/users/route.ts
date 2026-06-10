import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sanitizeString, isValidEmail, isValidPassword } from "@/lib/validate"
import { getSearchParams } from "@/lib/api-client"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(users)
  } catch (error) {
    console.error("GET /api/users error:", error)
    return NextResponse.json({ error: "Gagal memuat data user" }, { status: 500 })
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
  const email = sanitizeString(body.email)
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 })
  }

  // Validasi cabang wajib diisi
  const branchId = sanitizeString(body.branchId)
  if (!branchId) {
    return NextResponse.json({ error: "Cabang wajib dipilih untuk setiap pengguna" }, { status: 400 })
  }

  // Pastikan cabang ada dan aktif
  const branch = await prisma.branch.findFirst({ where: { id: branchId, isActive: true } })
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan atau tidak aktif" }, { status: 400 })
  }

  const password = body.password ? sanitizeString(body.password) : "Password1!"
  const pwCheck = isValidPassword(password)
  if (!pwCheck.valid) {
    return NextResponse.json({ error: pwCheck.message }, { status: 400 })
  }

  // Cek email duplikat
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "Email sudah digunakan" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const role = body.role === "ADMIN" ? "ADMIN" : "CASHIER"

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role, branchId },
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        branchId: true, branch: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("POST /api/users error:", error)
    return NextResponse.json({ error: "Gagal menambahkan pengguna" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  const name = sanitizeString(body.name)
  const email = sanitizeString(body.email)
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nama minimal 2 karakter" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 })
  }

  // Validasi cabang wajib diisi
  const branchId = sanitizeString(body.branchId)
  if (!branchId) {
    return NextResponse.json({ error: "Cabang wajib dipilih untuk setiap pengguna" }, { status: 400 })
  }

  // Pastikan cabang ada dan aktif
  const branch = await prisma.branch.findFirst({ where: { id: branchId, isActive: true } })
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan atau tidak aktif" }, { status: 400 })
  }

  // Cek email duplikat (kecuali user ini sendiri)
  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: sanitizeString(body.id) } },
  })
  if (existing) {
    return NextResponse.json({ error: "Email sudah digunakan oleh pengguna lain" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    role: body.role === "ADMIN" ? "ADMIN" : "CASHIER",
    branchId,
  }

  if (body.password) {
    const password = sanitizeString(body.password)
    const pwCheck = isValidPassword(password)
    if (!pwCheck.valid) {
      return NextResponse.json({ error: pwCheck.message }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(password, 10)
  }

  try {
    const user = await prisma.user.update({
      where: { id: sanitizeString(body.id) },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true, createdAt: true,
        branchId: true, branch: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("PUT /api/users error:", error)
    return NextResponse.json({ error: "Gagal mengupdate pengguna" }, { status: 500 })
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

  // Jangan hapus diri sendiri
  const currentUserId = (session.user as { id: string }).id
  if (id === currentUserId) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 })
  }

  try {
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Pengguna masih memiliki data transaksi" }, { status: 400 })
  }
}
