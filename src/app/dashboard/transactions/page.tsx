"use client"

import { useEffect, useState } from "react"
import { Eye, Calendar } from "lucide-react"

interface Transaction {
  id: string; transactionNumber: string; totalAmount: number; paymentAmount: number
  changeAmount: number; createdAt: string; user: { name: string }
  _count?: { items: number }
}
interface TransactionDetail {
  id: string; transactionNumber: string; totalAmount: number; paymentAmount: number
  changeAmount: number; createdAt: string; user: { name: string }
  items: { id: string; productName: string; quantity: number; price: number; subtotal: number }[]
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<TransactionDetail | null>(null)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchTransactions = async () => {
    const params = new URLSearchParams()
    if (dateFrom) params.append("dateFrom", dateFrom)
    if (dateTo) params.append("dateTo", dateTo)
    const res = await fetch(`/api/transactions?${params}`)
    setTransactions(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [dateFrom, dateTo])

  const viewDetail = async (id: string) => {
    const res = await fetch(`/api/transactions?id=${id}`)
    setDetail(await res.json())
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Riwayat Transaksi</h1>

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
        <button onClick={fetchTransactions} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Calendar className="w-4 h-4" /> Filter
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">No. Transaksi</th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kasir</th>
                    <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="text-right px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-800">{tx.transactionNumber}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{new Date(tx.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{tx.user.name}</td>
                      <td className="px-4 lg:px-6 py-4 text-center text-sm">{tx._count?.items || 0}</td>
                      <td className="px-4 lg:px-6 py-4 text-right text-sm font-semibold">{formatCurrency(tx.totalAmount)}</td>
                      <td className="px-4 lg:px-6 py-4 text-center">
                        <button onClick={() => viewDetail(tx.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada transaksi</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{tx.transactionNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString("id-ID")}</p>
                  </div>
                  <button onClick={() => viewDetail(tx.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500">
                    <p>Kasir: <span className="text-gray-700">{tx.user.name}</span></p>
                    <p>Item: <span className="text-gray-700">{tx._count?.items || 0}</span></p>
                  </div>
                  <p className="font-bold text-blue-600">{formatCurrency(tx.totalAmount)}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center text-gray-400 py-12">Belum ada transaksi</div>
            )}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold">Detail Transaksi</h2>
              <button onClick={() => setDetail(null)} className="p-1 hover:bg-gray-100 rounded"><span className="sr-only">Close</span>✕</button>
            </div>

            <div className="space-y-2 sm:space-y-3 mb-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">No. Transaksi</span><span className="font-medium text-right">{detail.transactionNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tanggal</span><span className="text-right">{new Date(detail.createdAt).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Kasir</span><span>{detail.user.name}</span></div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Item</h3>
              <div className="space-y-2">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="min-w-0 flex-1 mr-2">
                      <p className="font-medium truncate">{item.productName}</p>
                      <p className="text-gray-500 text-xs">{item.quantity} x {formatCurrency(item.price)}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">{formatCurrency(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span><span>{formatCurrency(detail.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bayar</span><span>{formatCurrency(detail.paymentAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Kembali</span><span>{formatCurrency(detail.changeAmount)}</span>
              </div>
            </div>

            <button onClick={() => setDetail(null)} className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
