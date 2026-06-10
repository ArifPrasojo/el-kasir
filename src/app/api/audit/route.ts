import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getPaginationParams, paginatedResponse } from "@/lib/pagination"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const { skip, take, page, limit } = getPaginationParams(searchParams)
  const entity = searchParams.get("entity") || ""
  const action = searchParams.get("action") || ""

  const where: Record<string, unknown> = {}
  if (entity) where.entity = entity
  if (action) where.action = action

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json(paginatedResponse(logs, total, page, limit))
}
