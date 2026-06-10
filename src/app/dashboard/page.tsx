"use client"

import { useEffect, useState } from "react"
import {
  DollarSign, ShoppingCart, Package, AlertTriangle, TrendingUp, TrendingDown,
  Calendar, Clock, BarChart3, ArrowUpRight, ArrowDownRight, Layers
} from "lucide-react"
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

interface DashboardData {
  todaySales: number; yesterdaySales: number; salesChange: number
  todayTransactions: number; yesterdayTransactions: number
  totalProducts: number; activeProducts: number
  lowStockProducts: { id: string; name: string; stock: number; price: number }[]
  avgTxValue: number; avgWeekTxValue: number
  thisWeekRevenue: number; prevWeekRevenue: number; weekChange: number
  monthRevenue: number; lastMonthRevenue: number; monthChange: number
  salesChart: { date: string; revenue: number; transactions: number; profit: number }[]
  categoryBreakdown: { name: string; revenue: number; quantity: number }[]
  hourlySales: { hour: number; revenue: number; count: number }[]
  topProducts: { name: string; quantity: number; revenue: number; profit: number; margin: number }[]
  topCategories: { name: string; revenue: number; quantity: number }[]
  recentTransactions: { id: string; number: string; total: number; date: string; cashier: string; items: number }[]
  totalProfitThisMonth: number; inventoryValue: number
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartTab, setChartTab] = useState<"revenue" | "profit">("revenue")

  useEffect(() => {
    fetch("/api/reports?type=dashboard")
      .then((res) => res.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const fc = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fmtK = (v: number) => {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`
    if (v >= 1000) return `${(v / 1000).toFixed(0)}rb`
    return v.toString()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }
  if (!data) return <div className="text-center text-gray-500 py-20">Gagal memuat data dashboard</div>

  const chartData = data.salesChart.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
  }))

  const pieData = data.categoryBreakdown.map((c) => ({ name: c.name, value: c.revenue }))
  const totalCatRevenue = pieData.reduce((s, c) => s + c.value, 0)

  const hourlyData = data.hourlySales.map((h) => ({
    ...h,
    label: `${h.hour}:00`,
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard Analytics</h1>
        <div className="text-xs text-gray-400 hidden sm:block">
          <Calendar className="w-3.5 h-3.5 inline mr-1" />
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today Sales */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Penjualan Hari Ini</p>
            <div className="bg-green-100 p-1.5 rounded-lg"><DollarSign className="w-3.5 h-3.5 text-green-600" /></div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{fc(data.todaySales)}</p>
          <div className="flex items-center gap-1 mt-1">
            {data.salesChange >= 0 ? (
              <span className="flex items-center text-xs text-green-600"><ArrowUpRight className="w-3 h-3" />{data.salesChange}%</span>
            ) : (
              <span className="flex items-center text-xs text-red-600"><ArrowDownRight className="w-3 h-3" />{Math.abs(data.salesChange)}%</span>
            )}
            <span className="text-xs text-gray-400">vs kemarin</span>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Transaksi Hari Ini</p>
            <div className="bg-blue-100 p-1.5 rounded-lg"><ShoppingCart className="w-3.5 h-3.5 text-blue-600" /></div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{data.todayTransactions}</p>
          <p className="text-xs text-gray-400 mt-1">Rata-rata: {fc(data.avgTxValue)}/trx</p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Penjualan Bulan Ini</p>
            <div className="bg-purple-100 p-1.5 rounded-lg"><BarChart3 className="w-3.5 h-3.5 text-purple-600" /></div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-gray-800 truncate">{fc(data.monthRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {data.monthChange >= 0 ? (
              <span className="flex items-center text-xs text-green-600"><ArrowUpRight className="w-3 h-3" />{data.monthChange}%</span>
            ) : (
              <span className="flex items-center text-xs text-red-600"><ArrowDownRight className="w-3 h-3" />{Math.abs(data.monthChange)}%</span>
            )}
            <span className="text-xs text-gray-400">vs bulan lalu</span>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-5 shadow-sm border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs sm:text-sm text-gray-500">Estimasi Profit (30h)</p>
            <div className="bg-emerald-100 p-1.5 rounded-lg"><TrendingUp className="w-3.5 h-3.5 text-emerald-600" /></div>
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-600 truncate">{fc(data.totalProfitThisMonth)}</p>
          <p className="text-xs text-gray-400 mt-1">Dari 30 hari terakhir</p>
        </div>
      </div>

      {/* KPI Cards - Row 2 (Mini stats) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Minggu Ini</p>
          <p className="text-sm font-bold truncate">{fc(data.thisWeekRevenue)}</p>
          <p className={`text-xs ${data.weekChange >= 0 ? "text-green-500" : "text-red-500"}`}>
            {data.weekChange >= 0 ? "+" : ""}{data.weekChange}% vs minggu lalu
          </p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Total Produk Aktif</p>
          <p className="text-sm font-bold">{data.activeProducts}</p>
          <p className="text-xs text-gray-400">dari {data.totalProducts} produk</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Rata-rata/Transaksi</p>
          <p className="text-sm font-bold truncate">{fc(data.avgWeekTxValue)}</p>
          <p className="text-xs text-gray-400">7 hari terakhir</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border">
          <p className="text-xs text-gray-500">Stok Rendah</p>
          <p className="text-sm font-bold text-red-600">{data.lowStockProducts.length} produk</p>
          <p className="text-xs text-gray-400">Perlu restock</p>
        </div>
      </div>

      {/* Sales Trend Chart (30 days) */}
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">Tren Penjualan 30 Hari</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setChartTab("revenue")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${chartTab === "revenue" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              Pendapatan
            </button>
            <button onClick={() => setChartTab("profit")}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${chartTab === "profit" ? "bg-white shadow text-emerald-600" : "text-gray-500 hover:text-gray-700"}`}>
              Profit
            </button>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" fontSize={11} tick={{ fill: "#9ca3af" }} interval="preserveStartEnd" />
              <YAxis fontSize={11} tick={{ fill: "#9ca3af" }} tickFormatter={fmtK} />
              <Tooltip
                formatter={(value, name) => [fc(Number(value)), name === "revenue" ? "Pendapatan" : "Profit"]}
                labelStyle={{ fontSize: 12 }}
              />
              {chartTab === "revenue" ? (
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#colorRevenue)" />
              ) : (
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fill="url(#colorProfit)" />
              )}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[320px] flex items-center justify-center text-gray-400">Belum ada data penjualan</div>
        )}
      </div>

      {/* Category Breakdown + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Pie Chart - Categories */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Penjualan per Kategori</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [fc(Number(value)), "Penjualan"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full space-y-2">
                {pieData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 text-gray-700 truncate">{cat.name}</span>
                    <span className="text-gray-500 text-xs">{totalCatRevenue > 0 ? Math.round((cat.value / totalCatRevenue) * 100) : 0}%</span>
                    <span className="font-medium text-gray-800 text-xs w-16 text-right">{fc(cat.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">Belum ada data</div>
          )}
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Produk Terlaris</h2>
          {data.topProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="text-left pb-2 font-medium">Produk</th>
                    <th className="text-center pb-2 font-medium">Qty</th>
                    <th className="text-right pb-2 font-medium">Pendapatan</th>
                    <th className="text-right pb-2 font-medium">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topProducts.slice(0, 7).map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 flex items-center justify-center text-xs bg-gray-100 rounded-full font-bold text-gray-500">{i + 1}</span>
                          <span className="text-gray-800 truncate max-w-[120px] sm:max-w-[160px]">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-gray-600">{p.quantity}</td>
                      <td className="py-2.5 text-right font-medium text-gray-800">{fc(p.revenue)}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-medium ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fc(p.profit)}</span>
                        <span className="text-xs text-gray-400 ml-1">({p.margin}%)</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Hourly Sales + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Hourly Sales Distribution */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-400" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Distribusi Penjualan per Jam (Hari Ini)</h2>
          </div>
          {hourlyData.some((h) => h.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" fontSize={10} tick={{ fill: "#9ca3af" }} />
                <YAxis fontSize={10} tick={{ fill: "#9ca3af" }} tickFormatter={fmtK} />
                <Tooltip formatter={(value) => [fc(Number(value)), "Penjualan"]} />
                <Bar dataKey="revenue" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">Belum ada transaksi hari ini</div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-gray-400" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Transaksi Terbaru</h2>
          </div>
          {data.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {data.recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm font-medium text-gray-800 truncate">{tx.number}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.date).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      {" · "}{tx.cashier}{" · "}{tx.items} item
                    </p>
                  </div>
                  <p className="font-semibold text-blue-600 text-sm whitespace-nowrap">{fc(tx.total)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">Belum ada transaksi</div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Peringatan Stok Rendah</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {data.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-600">{product.stock}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 text-sm truncate">{product.name}</p>
                  <p className="text-xs text-red-600">Stok: {product.stock} · Harga: {fc(product.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
