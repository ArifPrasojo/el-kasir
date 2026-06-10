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
    const now = new Date()

    // Today boundaries
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Yesterday boundaries
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    // This week (last 7 days)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    weekAgo.setHours(0, 0, 0, 0)

    // Previous week (8-14 days ago)
    const prevWeekAgo = new Date(now)
    prevWeekAgo.setDate(prevWeekAgo.getDate() - 14)
    prevWeekAgo.setHours(0, 0, 0, 0)

    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    // Last 30 days
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Parallel queries for performance
    const [
      todaySalesAgg,
      yesterdaySalesAgg,
      todayCount,
      yesterdayCount,
      totalProducts,
      lowStockProducts,
      weekTransactions,
      prevWeekTransactions,
      monthSalesAgg,
      lastMonthSalesAgg,
      last30DaysTx,
      allCategories,
      activeProducts,
    ] = await Promise.all([
      prisma.transaction.aggregate({ where: { createdAt: { gte: today } }, _sum: { totalAmount: true } }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: yesterday, lt: today } }, _sum: { totalAmount: true } }),
      prisma.transaction.count({ where: { createdAt: { gte: today } } }),
      prisma.transaction.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
      prisma.product.count(),
      prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, take: 10 }),
      prisma.transaction.findMany({ where: { createdAt: { gte: weekAgo } }, select: { totalAmount: true, createdAt: true, items: true } }),
      prisma.transaction.findMany({ where: { createdAt: { gte: prevWeekAgo, lt: weekAgo } }, select: { totalAmount: true } }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
      prisma.transaction.aggregate({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { totalAmount: true } }),
      prisma.transaction.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: { totalAmount: true, createdAt: true, items: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
      prisma.product.count({ where: { isActive: true } }),
    ])

    const todaySales = todaySalesAgg._sum.totalAmount || 0
    const yesterdaySales = yesterdaySalesAgg._sum.totalAmount || 0
    const thisWeekRevenue = weekTransactions.reduce((s, t) => s + t.totalAmount, 0)
    const prevWeekRevenue = prevWeekTransactions.reduce((s, t) => s + t.totalAmount, 0)
    const monthRevenue = monthSalesAgg._sum.totalAmount || 0
    const lastMonthRevenue = lastMonthSalesAgg._sum.totalAmount || 0

    // Daily sales chart (last 30 days, fill gaps)
    const dailyMap: Record<string, { revenue: number; transactions: number; profit: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split("T")[0]
      dailyMap[key] = { revenue: 0, transactions: 0, profit: 0 }
    }

    // Calculate profit from items
    const productCostMap: Record<string, number> = {}
    const allProductsForCost = await prisma.product.findMany({ select: { id: true, cost: true } })
    allProductsForCost.forEach((p) => { productCostMap[p.id] = p.cost })

    last30DaysTx.forEach((tx) => {
      const key = tx.createdAt.toISOString().split("T")[0]
      if (dailyMap[key]) {
        dailyMap[key].revenue += tx.totalAmount
        dailyMap[key].transactions += 1
        tx.items.forEach((item) => {
          const cost = productCostMap[item.productId] || 0
          dailyMap[key].profit += (item.price - cost) * item.quantity
        })
      }
    })

    const salesChart = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      transactions: data.transactions,
      profit: data.profit,
    }))

    // Category sales breakdown
    const categorySales: Record<string, { name: string; revenue: number; quantity: number }> = {}
    allCategories.forEach((c) => { categorySales[c.id] = { name: c.name, revenue: 0, quantity: 0 } })

    const allItems30Days = await prisma.transactionItem.findMany({
      where: { product: { categoryId: { in: allCategories.map(c => c.id) } }, transaction: { createdAt: { gte: thirtyDaysAgo } } },
      include: { product: { select: { categoryId: true } } },
    })

    allItems30Days.forEach((item) => {
      const catId = item.product.categoryId
      if (categorySales[catId]) {
        categorySales[catId].revenue += item.subtotal
        categorySales[catId].quantity += item.quantity
      }
    })

    const categoryBreakdown = Object.values(categorySales)
      .filter((c) => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)

    // Hourly sales distribution (today)
    const hourlySales: { hour: number; revenue: number; count: number }[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i, revenue: 0, count: 0,
    }))

    const todayTx = await prisma.transaction.findMany({
      where: { createdAt: { gte: today } },
      select: { totalAmount: true, createdAt: true },
    })
    todayTx.forEach((tx) => {
      const h = tx.createdAt.getHours()
      hourlySales[h].revenue += tx.totalAmount
      hourlySales[h].count += 1
    })

    // Top products (all time)
    const topProducts = await prisma.transactionItem.groupBy({
      by: ["productName", "productId"],
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    })

    // Calculate profit for top products
    const topProductsWithProfit = await Promise.all(
      topProducts.map(async (p) => {
        const product = await prisma.product.findUnique({ where: { id: p.productId } })
        const cost = product?.cost || 0
        const revenue = p._sum.subtotal || 0
        const qty = p._sum.quantity || 0
        const profit = revenue - (cost * qty)
        return {
          name: p.productName,
          quantity: qty,
          revenue,
          profit,
          margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
        }
      })
    )

    // Top categories by revenue
    const topCategories = categoryBreakdown.slice(0, 5)

    // Recent transactions
    const recentTx = await prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, _count: { select: { items: true } } },
    })

    // Average transaction value
    const avgTxValue = todayCount > 0 ? todaySales / todayCount : 0
    const avgWeekTxValue = weekTransactions.length > 0 ? thisWeekRevenue / weekTransactions.length : 0

    // Stock value (total inventory value)
    const inventoryValue = await prisma.product.aggregate({
      where: { isActive: true },
      _sum: { stock: true },
    })

    // Percentage changes
    const salesChange = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : todaySales > 0 ? 100 : 0
    const weekChange = prevWeekRevenue > 0 ? Math.round(((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100) : thisWeekRevenue > 0 ? 100 : 0
    const monthChange = lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : monthRevenue > 0 ? 100 : 0

    return NextResponse.json({
      // KPI Cards
      todaySales,
      yesterdaySales,
      salesChange,
      todayTransactions: todayCount,
      yesterdayTransactions: yesterdayCount,
      totalProducts,
      activeProducts,
      lowStockProducts: lowStockProducts.map((p) => ({ id: p.id, name: p.name, stock: p.stock, price: p.price })),
      avgTxValue: Math.round(avgTxValue),
      avgWeekTxValue: Math.round(avgWeekTxValue),
      // Revenue
      thisWeekRevenue,
      prevWeekRevenue,
      weekChange,
      monthRevenue,
      lastMonthRevenue,
      monthChange,
      // Charts
      salesChart,
      categoryBreakdown: topCategories,
      hourlySales: hourlySales.filter((h) => h.hour >= 6 && h.hour <= 22),
      topProducts: topProductsWithProfit,
      topCategories,
      // Recent
      recentTransactions: recentTx.map((tx) => ({
        id: tx.id,
        number: tx.transactionNumber,
        total: tx.totalAmount,
        date: tx.createdAt,
        cashier: tx.user.name,
        items: tx._count.items,
      })),
      // Profit
      totalProfitThisMonth: salesChart.reduce((s, d) => s + d.profit, 0),
      inventoryValue: inventoryValue._sum.stock || 0,
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
