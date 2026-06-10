"use client"

import { useEffect, useState } from "react"
import { ScrollText, Filter, Info } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface AuditEntry {
  id: string; action: string; entity: string; entityId: string | null; details: string; ipAddress: string; createdAt: string
  user: { name: string; email: string } | null
}

interface AuditResponse {
  data: AuditEntry[]
  pagination: { page: number; limit: number; total: number; totalPages: number; hasNext: boolean; hasPrev: boolean }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterEntity, setFilterEntity] = useState("")
  const [filterAction, setFilterAction] = useState("")

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: "20" })
      if (filterEntity) params.append("entity", filterEntity)
      if (filterAction) params.append("action", filterAction)
      const data = await apiFetch<AuditResponse>(`/api/audit?${params}`)
      if (data && typeof data === "object" && "data" in data) {
        setLogs(data.data || [])
        setTotalPages(data.pagination?.totalPages || 1)
        setTotal(data.pagination?.total || 0)
      } else {
        setLogs([])
      }
    } catch (err) { console.error(err); setLogs([]) }
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [page, filterEntity, filterAction])

  const actionBadge = (action: string) => {
    const map: Record<string, string> = {
      CREATE: "bg-green-100 text-green-700",
      UPDATE: "bg-blue-100 text-blue-700",
      DELETE: "bg-red-100 text-red-700",
      RECEIVE: "bg-purple-100 text-purple-700",
      LOGIN: "bg-yellow-100 text-yellow-700",
      LOGOUT: "bg-gray-100 text-gray-700",
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[action] || "bg-gray-100 text-gray-700"}`}>{action}</span>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Audit Log</h1>
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Apa itu Audit Log?</p>
            <p>Audit Log mencatat <strong>semua aktivitas penting</strong> di sistem secara otomatis: siapa yang melakukan, apa yang dilakukan, kapan, dan dari IP mana. Ini berguna untuk <strong>keamanan, pelacakan perubahan, dan investigasi masalah</strong>.</p>
            <p className="mt-1">Contoh: Admin menambah produk baru, Kasir melakukan transaksi, Admin menghapus user, dll.</p>
          </div>
        </div>
        <span className="text-sm text-gray-500">{total} entri</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Semua Entity</option>
          <option value="Branch">Cabang</option>
          <option value="Product">Produk</option>
          <option value="Category">Kategori</option>
          <option value="Supplier">Supplier</option>
          <option value="PurchaseOrder">Purchase Order</option>
          <option value="User">Pengguna</option>
        </select>
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Semua Aksi</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
          <option value="RECEIVE">Receive</option>
        </select>
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
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Entity</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Detail</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-xs text-gray-600 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("id-ID")}</td>
                      <td className="px-6 py-3 text-center">{actionBadge(log.action)}</td>
                      <td className="px-6 py-3 text-sm text-gray-800">{log.entity}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">{log.user?.name || "System"}</td>
                      <td className="px-6 py-3 text-xs text-gray-500 max-w-[200px] truncate">{log.details || "-"}</td>
                      <td className="px-6 py-3 text-xs text-gray-400 font-mono">{log.ipAddress || "-"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada audit log</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-lg shadow-sm border p-3">
                <div className="flex items-center justify-between mb-1">
                  {actionBadge(log.action)}
                  <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-sm text-gray-800"><span className="font-medium">{log.entity}</span> {log.details && `· ${log.details}`}</p>
                <p className="text-xs text-gray-500">{log.user?.name || "System"} {log.ipAddress && `· ${log.ipAddress}`}</p>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center text-gray-400 py-12">Belum ada audit log</div>}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Prev</button>
              <span className="text-sm text-gray-600">Halaman {page} dari {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
