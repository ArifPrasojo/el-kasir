"use client"

import { useEffect, useState } from "react"
import { Calendar, DollarSign, TrendingUp, ShoppingBag } from "lucide-react"

interface ReportData {
  transactions: {
    id: string; transactionNumber: string; totalAmount: number; createdAt: string
    user: { name: string }; items: { productName: string; quantity: number; subtotal: number }[]
  }[]
  totalRevenue: number; totalTransactions: number; totalProfit: number; totalCost: number
}

export default function ReportsPage() {
  const today = new Date().toISOString().split("T")[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [dateFrom, setDateFrom] = useState(weekAgo)
  const [dateTo, setDateTo] = useState(today)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchReport = async () => {
    setLoading(true)
    const res = await fetch(`/api/reports?type=report&dateFrom=${dateFrom}&dateTo=${dateTo}`)
    setReport(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchReport() }, [dateFrom, dateTo])

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Laporan Penjualan</h1>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-end">
        <div className="flex-1 sm:flex-none">
          <label className="text-xs sm:text-sm text-gray-500">Dari Tanggal</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <div className="flex-1 sm:flex-none">
          <label className="text-xs sm:text-sm text-gray-500">Sampai Tanggal</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="block w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <button onClick={fetchReport} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Calendar className="w-4 h-4" /> Tampilkan
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-green-100 p-1.5 sm:p-2 rounded-lg"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Pendapatan</p>
                  <p className="text-sm sm:text-xl font-bold truncate">{formatCurrency(report.totalRevenue)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg"><ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Transaksi</p>
                  <p className="text-sm sm:text-xl font-bold">{report.totalTransactions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-red-100 p-1.5 sm:p-2 rounded-lg"><DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Modal</p>
                  <p className="text-sm sm:text-xl font-bold truncate">{formatCurrency(report.totalCost)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-sm border">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-purple-100 p-1.5 sm:p-2 rounded-lg"><TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" /></div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Keuntungan</p>
                  <p className={`text-sm sm:text-xl font-bold truncate ${report.totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(report.totalProfit)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table - Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Detail Transaksi</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">No. Transaksi</th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kasir</th>
                    <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-right px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium">{tx.transactionNumber}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{tx.user.name}</td>
                      <td className="px-4 lg:px-6 py-4 text-center text-sm">{tx.items.length}</td>
                      <td className="px-4 lg:px-6 py-4 text-right text-sm font-semibold">{formatCurrency(tx.totalAmount)}</td>
                    </tr>
                  ))}
                  {report.transactions.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Tidak ada transaksi pada periode ini</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            <div className="px-1">
              <h2 className="font-semibold text-gray-800 text-sm">Detail Transaksi ({report.totalTransactions})</h2>
            </div>
            {report.transactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{tx.transactionNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <p className="font-bold text-blue-600 text-sm">{formatCurrency(tx.totalAmount)}</p>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t text-xs text-gray-500">
                  <span>Kasir: {tx.user.name}</span>
                  <span>{tx.items.length} item</span>
                </div>
              </div>
            ))}
            {report.transactions.length === 0 && (
              <div className="text-center text-gray-400 py-12">Tidak ada transaksi pada periode ini</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
