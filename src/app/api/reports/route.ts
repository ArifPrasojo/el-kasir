import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSearchParams } from "@/lib/api-client"

type SessionUser = { id: string; role: string; branchId?: string }

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const sessionUser = session.user as SessionUser
    const isAdmin = sessionUser.role === "ADMIN"

    const searchParams = getSearchParams(request.url)
    const type = searchParams.get("type") || "dashboard"
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const userScope = isAdmin ? {} : { userId: sessionUser.id }

    // ============================================================
    // DASHBOARD
    // ============================================================
    if (type === "dashboard") {
      const now = new Date()
      const today = new Date(now); today.setHours(0, 0, 0, 0)
      const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1); yesterday.setHours(0, 0, 0, 0)
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7); weekAgo.setHours(0, 0, 0, 0)
      const prevWeekAgo = new Date(now); prevWeekAgo.setDate(prevWeekAgo.getDate() - 14); prevWeekAgo.setHours(0, 0, 0, 0)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); thirtyDaysAgo.setHours(0, 0, 0, 0)

      const [
        todaySalesAgg, yesterdaySalesAgg,
        todayCount, yesterdayCount,
        totalProducts, activeProducts, lowStockProducts,
        weekTransactions, prevWeekTransactions,
        monthSalesAgg, lastMonthSalesAgg,
        last30DaysTx, allCategories,
        allProductsForCost,
      ] = await Promise.all([
        prisma.transaction.aggregate({ where: { ...userScope, createdAt: { gte: today } }, _sum: { totalAmount: true } }),
        prisma.transaction.aggregate({ where: { ...userScope, createdAt: { gte: yesterday, lt: today } }, _sum: { totalAmount: true } }),
        prisma.transaction.count({ where: { ...userScope, createdAt: { gte: today } } }),
        prisma.transaction.count({ where: { ...userScope, createdAt: { gte: yesterday, lt: today } } }),
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.findMany({ where: { stock: { lte: 5 }, isActive: true }, take: 10 }),
        prisma.transaction.findMany({ where: { ...userScope, createdAt: { gte: weekAgo } }, select: { totalAmount: true } }),
        prisma.transaction.findMany({ where: { ...userScope, createdAt: { gte: prevWeekAgo, lt: weekAgo } }, select: { totalAmount: true } }),
        prisma.transaction.aggregate({ where: { ...userScope, createdAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
        prisma.transaction.aggregate({ where: { ...userScope, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } }, _sum: { totalAmount: true } }),
        prisma.transaction.findMany({
          where: { ...userScope, createdAt: { gte: thirtyDaysAgo } },
          select: { totalAmount: true, createdAt: true, items: { select: { productId: true, price: true, quantity: true, subtotal: true } } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.category.findMany(),
        // Batch fetch semua product cost sekaligus — fix N+1
        prisma.product.findMany({ select: { id: true, cost: true } }),
      ])

      const todaySales = todaySalesAgg._sum.totalAmount || 0
      const yesterdaySales = yesterdaySalesAgg._sum.totalAmount || 0
      const thisWeekRevenue = weekTransactions.reduce((s, t) => s + t.totalAmount, 0)
      const prevWeekRevenue = prevWeekTransactions.reduce((s, t) => s + t.totalAmount, 0)
      const monthRevenue = monthSalesAgg._sum.totalAmount || 0
      const lastMonthRevenue = lastMonthSalesAgg._sum.totalAmount || 0

      // Build product cost map sekali
      const productCostMap = new Map(allProductsForCost.map((p) => [p.id, p.cost]))

      // Daily sales chart
      const dailyMap: Record<string, { revenue: number; transactions: number; profit: number }> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i)
        dailyMap[d.toISOString().split("T")[0]] = { revenue: 0, transactions: 0, profit: 0 }
      }
      last30DaysTx.forEach((tx) => {
        const key = tx.createdAt.toISOString().split("T")[0]
        if (dailyMap[key]) {
          dailyMap[key].revenue += tx.totalAmount
          dailyMap[key].transactions += 1
          tx.items.forEach((item) => {
            const cost = productCostMap.get(item.productId) || 0
            dailyMap[key].profit += (item.price - cost) * item.quantity
          })
        }
      })
      const salesChart = Object.entries(dailyMap).map(([date, data]) => ({ date, ...data }))

      // Category breakdown — satu query
      const categorySales: Record<string, { name: string; revenue: number; quantity: number }> = {}
      allCategories.forEach((c) => { categorySales[c.id] = { name: c.name, revenue: 0, quantity: 0 } })

      const allItems30Days = await prisma.transactionItem.findMany({
        where: { transaction: { ...userScope, createdAt: { gte: thirtyDaysAgo } } },
        include: { product: { select: { categoryId: true } } },
      })
      allItems30Days.forEach((item) => {
        const catId = item.product.categoryId
        if (categorySales[catId]) {
          categorySales[catId].revenue += item.subtotal
          categorySales[catId].quantity += item.quantity
        }
      })
      const categoryBreakdown = Object.values(categorySales).filter((c) => c.revenue > 0).sort((a, b) => b.revenue - a.revenue)

      // Hourly sales
      const hourlySales: { hour: number; revenue: number; count: number }[] = Array.from({ length: 24 }, (_, i) => ({ hour: i, revenue: 0, count: 0 }))
      const todayTx = await prisma.transaction.findMany({
        where: { ...userScope, createdAt: { gte: today } },
        select: { totalAmount: true, createdAt: true },
      })
      todayTx.forEach((tx) => {
        const h = tx.createdAt.getHours()
        hourlySales[h].revenue += tx.totalAmount
        hourlySales[h].count += 1
      })

      // Top products — fix N+1: batch fetch semua product sekaligus
      const topProductsRaw = await prisma.transactionItem.groupBy({
        by: ["productName", "productId"],
        where: { transaction: { ...userScope } },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      })
      const topProductIds = topProductsRaw.map((p) => p.productId)
      const topProductDetails = topProductIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: topProductIds } }, select: { id: true, cost: true } })
        : []
      const topProductCostMap = new Map(topProductDetails.map((p) => [p.id, p.cost]))
      const topProductsWithProfit = topProductsRaw.map((p) => {
        const cost = topProductCostMap.get(p.productId) || 0
        const revenue = p._sum.subtotal || 0
        const qty = p._sum.quantity || 0
        const profit = revenue - cost * qty
        return { name: p.productName, quantity: qty, revenue, profit, margin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0 }
      })

      // Recent transactions
      const recentTx = await prisma.transaction.findMany({
        where: { ...userScope },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } }, _count: { select: { items: true } } },
      })

      const avgTxValue = todayCount > 0 ? todaySales / todayCount : 0
      const avgWeekTxValue = weekTransactions.length > 0 ? thisWeekRevenue / weekTransactions.length : 0
      const salesChange = yesterdaySales > 0 ? Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : todaySales > 0 ? 100 : 0
      const weekChange = prevWeekRevenue > 0 ? Math.round(((thisWeekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100) : thisWeekRevenue > 0 ? 100 : 0
      const monthChange = lastMonthRevenue > 0 ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : monthRevenue > 0 ? 100 : 0

      return NextResponse.json({
        todaySales, yesterdaySales, salesChange,
        todayTransactions: todayCount, yesterdayTransactions: yesterdayCount,
        totalProducts, activeProducts,
        lowStockProducts: lowStockProducts.map((p) => ({ id: p.id, name: p.name, stock: p.stock, price: p.price })),
        avgTxValue: Math.round(avgTxValue), avgWeekTxValue: Math.round(avgWeekTxValue),
        thisWeekRevenue, prevWeekRevenue, weekChange,
        monthRevenue, lastMonthRevenue, monthChange,
        salesChart,
        categoryBreakdown: categoryBreakdown.slice(0, 5),
        hourlySales: hourlySales.filter((h) => h.hour >= 6 && h.hour <= 22),
        topProducts: topProductsWithProfit,
        topCategories: categoryBreakdown.slice(0, 5),
        recentTransactions: recentTx.map((tx) => ({
          id: tx.id, number: tx.transactionNumber, total: tx.totalAmount,
          date: tx.createdAt, cashier: tx.user.name, items: tx._count.items,
        })),
        totalProfitThisMonth: salesChart.reduce((s, d) => s + d.profit, 0),
        inventoryValue: 0,
      })
    }

    // ============================================================
    // REPORT
    // ============================================================
    if (type === "report") {
      const where: Record<string, unknown> = { ...userScope }
      if (dateFrom && dateTo) {
        where.createdAt = { gte: new Date(dateFrom), lte: new Date(dateTo + "T23:59:59") }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          user: { select: { name: true } },
          customer: { select: { name: true } },
          items: { select: { productId: true, quantity: true, subtotal: true } },
        },
        orderBy: { createdAt: "desc" },
      })

      const totalRevenue = transactions.reduce((sum, tx) => sum + tx.totalAmount, 0)

      // Fix N+1: batch fetch semua product cost sekaligus
      const allItemProductIds = [...new Set(transactions.flatMap((tx) => tx.items.map((i) => i.productId)))]
      const productsForCost = allItemProductIds.length > 0
        ? await prisma.product.findMany({ where: { id: { in: allItemProductIds } }, select: { id: true, cost: true } })
        : []
      const costMap = new Map(productsForCost.map((p) => [p.id, p.cost]))

      let totalCost = 0
      transactions.forEach((tx) => {
        tx.items.forEach((item) => {
          totalCost += (costMap.get(item.productId) || 0) * item.quantity
        })
      })

      return NextResponse.json({
        transactions,
        totalRevenue,
        totalTransactions: transactions.length,
        totalProfit: totalRevenue - totalCost,
        totalCost,
      })
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 })
  } catch (error) {
    console.error("GET /api/reports error:", error)
    return NextResponse.json({ error: "Gagal memuat laporan" }, { status: 500 })
  }
}
