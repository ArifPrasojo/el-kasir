import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { sanitizeString, isValidEmail } from "@/lib/validate"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
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
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  const password = body.password ? sanitizeString(body.password) : "password123"
  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)
  const role = body.role === "ADMIN" ? "ADMIN" : "CASHIER"

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user, { status: 201 })
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
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 })
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {
    name,
    email,
    role: body.role === "ADMIN" ? "ADMIN" : "CASHIER",
  }

  if (body.password) {
    const password = sanitizeString(body.password)
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    updateData.password = await bcrypt.hash(password, 10)
  }

  const user = await prisma.user.update({
    where: { id: sanitizeString(body.id) },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  })

  return NextResponse.json(user)
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
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "User has transactions" }, { status: 400 })
  }
}
