"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, UserCheck, Star, MapPin } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/Toast"

interface Customer {
  id: string; name: string; phone: string; email: string
  totalPoints: number; totalSpent: number; createdAt: string
  _count?: { transactions: number }; branch?: { name: string } | null
}

type SessionUser = { role?: string; branchName?: string; branchId?: string }

export default function CustomersPage() {
  const { data: session } = useSession()
  const { success, error: toastError } = useToast()
  const sessionUser = session?.user as SessionUser | undefined
  const isAdmin = sessionUser?.role === "ADMIN"

  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: "", phone: "", email: "" })

  const fc = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchCustomers = async () => {
    try {
      const data = await apiFetch<Customer[]>("/api/customers")
      setCustomers(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [])

  const resetForm = () => { setForm({ name: "", phone: "", email: "" }); setEditing(null); setShowForm(false) }

  const handleEdit = (c: Customer) => {
    setForm({ name: c.name, phone: c.phone, email: c.email }); setEditing(c); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/customers", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menyimpan customer")
        return
      }
      success(editing ? "Customer berhasil diupdate" : "Customer berhasil ditambahkan")
      resetForm(); fetchCustomers()
    } catch {
      toastError("Gagal menyimpan customer")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus customer ini?")) return
    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menghapus customer")
        return
      }
      success("Customer berhasil dihapus")
      fetchCustomers()
    } catch {
      toastError("Gagal menghapus customer")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Customer</h1>
          {!isAdmin && sessionUser?.branchName && (
            <div className="flex items-center gap-1.5 mt-1 text-sm text-emerald-700">
              <MapPin className="w-3.5 h-3.5" />
              <span>{sessionUser.branchName}</span>
              <span className="text-gray-400">· Customer di cabang Anda</span>
            </div>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Customer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Customer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama <span className="text-red-500">*</span></label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              {!isAdmin && sessionUser?.branchName && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  Customer akan otomatis terdaftar di cabang <span className="font-medium text-emerald-700">{sessionUser.branchName}</span>
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  {editing ? "Update" : "Simpan"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border text-center">
          <p className="text-xl sm:text-2xl font-bold text-gray-800">{customers.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Customer</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border text-center">
          <p className="text-xl sm:text-2xl font-bold text-blue-600">
            {customers.reduce((s, c) => s + (c._count?.transactions || 0), 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total Transaksi</p>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border text-center">
          <p className="text-xl sm:text-2xl font-bold text-yellow-500">
            {customers.reduce((s, c) => s + c.totalPoints, 0)}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Total Poin</p>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Telepon</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                {isAdmin && <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cabang</th>}
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Transaksi</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total Belanja</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Poin</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.phone || "—"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.email || "—"}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.branch?.name ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          <MapPin className="w-3 h-3" />{c.branch.name}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                  )}
                  <td className="px-6 py-4 text-center text-sm">{c._count?.transactions || 0}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">{fc(c.totalSpent)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      <Star className="w-3 h-3" />{c.totalPoints}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-400">Belum ada customer</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {customers.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.phone || "—"}{c.email ? ` · ${c.email}` : ""}</p>
                  {isAdmin && c.branch?.name && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-700 mt-0.5">
                      <MapPin className="w-3 h-3" />{c.branch.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                <Star className="w-3 h-3" />{c.totalPoints}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t text-sm">
              <span className="text-gray-500">{c._count?.transactions || 0} transaksi</span>
              <span className="font-semibold">{fc(c.totalSpent)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => handleEdit(c)}
                className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              {isAdmin && (
                <button onClick={() => handleDelete(c.id)}
                  className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 py-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              )}
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="text-center text-gray-400 py-12">Belum ada customer</div>
        )}
      </div>
    </div>
  )
}
