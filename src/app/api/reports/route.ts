import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "dashboard"
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  if (type === "dashboard") {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [todaySales, todayTransactions, totalProducts, lowStockProducts] = await Promise.all([
      prisma.transaction.aggregate({
        where: { createdAt: { gte: today } },
        _sum: { totalAmount: true },
        _count: true,
      }),
      prisma.transaction.count({ where: { createdAt: { gte: today } } }),
      prisma.product.count(),
      prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, take: 5 }),
    ])

    // Last 7 days sales
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const weeklyTransactions = await prisma.transaction.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    // Group by date
    const salesByDate: Record<string, number> = {}
    weeklyTransactions.forEach((tx) => {
      const dateKey = tx.createdAt.toISOString().split("T")[0]
      salesByDate[dateKey] = (salesByDate[dateKey] || 0) + tx.totalAmount
    })

    // Top selling products
    const topProducts = await prisma.transactionItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    })

    return NextResponse.json({
      todaySales: todaySales._sum.totalAmount || 0,
      todayTransactions: todayTransactions,
      totalProducts,
      lowStockProducts,
      salesChart: Object.entries(salesByDate).map(([date, total]) => ({ date, total })),
      topProducts: topProducts.map((p) => ({
        name: p.productName,
        quantity: p._sum.quantity || 0,
        revenue: p._sum.subtotal || 0,
      })),
    })
  }

  if (type === "report") {
    const where: Record<string, unknown> = {}
    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo + "T23:59:59"),
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { user: true, items: true },
      orderBy: { createdAt: "desc" },
    })

    const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0)
    const totalTransactions = transactions.length

    // Calculate profit
    let totalCost = 0
    for (const tx of transactions) {
      for (const item of tx.items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } })
        if (product) {
          totalCost += product.cost * item.quantity
        }
      }
    }

    return NextResponse.json({
      transactions,
      totalRevenue,
      totalTransactions,
      totalProfit: totalRevenue - totalCost,
      totalCost,
    })
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 })
}
