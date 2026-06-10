import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sanitizeNumber } from "@/lib/validate"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const shifts = await prisma.cashierShift.findMany({
    include: { user: { select: { name: true } }, branch: { select: { name: true } }, _count: { select: { transactions: true } } },
    orderBy: { openedAt: "desc" },
    take: 50,
  })
  return NextResponse.json(shifts)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const body = await request.json()

  // Check if user has an open shift
  const openShift = await prisma.cashierShift.findFirst({
    where: { userId, status: "OPEN" },
  })

  if (body.action === "open") {
    if (openShift) return NextResponse.json({ error: "Anda masih memiliki shift yang terbuka" }, { status: 400 })

    const shift = await prisma.cashierShift.create({
      data: {
        userId,
        branchId: body.branchId || null,
        shiftType: body.shiftType === "MALAM" ? "MALAM" : "PAGI",
        openingBalance: sanitizeNumber(body.openingBalance, 0),
        status: "OPEN",
      },
    })
    return NextResponse.json(shift, { status: 201 })
  }

  if (body.action === "close") {
    if (!openShift) return NextResponse.json({ error: "Tidak ada shift yang terbuka" }, { status: 400 })

    // Calculate total sales during shift
    const totalSales = await prisma.transaction.aggregate({
      where: { shiftId: openShift.id },
      _sum: { totalAmount: true },
    })

    const shift = await prisma.cashierShift.update({
      where: { id: openShift.id },
      data: {
        closedAt: new Date(),
        closingBalance: sanitizeNumber(body.closingBalance, 0),
        totalSales: totalSales._sum.totalAmount || 0,
        notes: body.notes || "",
        status: "CLOSED",
      },
    })
    return NextResponse.json(shift)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}

// Check current open shift for user
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as { id: string }).id
  const openShift = await prisma.cashierShift.findFirst({
    where: { userId, status: "OPEN" },
    include: { _count: { select: { transactions: true } } },
  })

  return NextResponse.json(openShift)
}
