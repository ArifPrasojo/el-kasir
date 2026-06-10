"use client"

import { useEffect, useState } from "react"
import { DollarSign, ShoppingCart, Package, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DashboardData {
  todaySales: number
  todayTransactions: number
  totalProducts: number
  lowStockProducts: { id: string; name: string; stock: number }[]
  salesChart: { date: string; total: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/reports?type=dashboard")
      .then((res) => res.json())
      .then((data) => { setData(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  if (!data) return <div className="text-center text-gray-500">Gagal memuat data</div>

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const chartData = data.salesChart.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
  }))

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Penjualan Hari Ini</p>
              <p className="text-base sm:text-2xl font-bold text-gray-800 truncate">{formatCurrency(data.todaySales)}</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Transaksi Hari Ini</p>
              <p className="text-base sm:text-2xl font-bold text-gray-800">{data.todayTransactions}</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Total Produk</p>
              <p className="text-base sm:text-2xl font-bold text-gray-800">{data.totalProducts}</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs sm:text-sm text-gray-500 truncate">Stok Rendah</p>
              <p className="text-base sm:text-2xl font-bold text-gray-800">{data.lowStockProducts.length}</p>
            </div>
            <div className="bg-red-100 p-2 sm:p-3 rounded-full flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Penjualan 7 Hari Terakhir</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Penjualan"]} />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data penjualan</div>
          )}
        </div>

        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Produk Terlaris</h2>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.quantity} terjual</p>
                  </div>
                  <p className="font-semibold text-blue-600">{formatCurrency(product.revenue)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">Belum ada data penjualan</div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {data.lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Peringatan Stok Rendah</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {data.lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-sm text-red-600">Stok: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
