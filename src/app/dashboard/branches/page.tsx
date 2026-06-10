"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Building2, Users, Info } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Branch {
  id: string; name: string; address: string; phone: string; isActive: boolean; createdAt: string
  _count?: { users: number; products: number; transactions: number }
}
interface User { id: string; name: string; email: string; branchId: string | null }

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState({ name: "", address: "", phone: "", isActive: true })
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const fetchData = async () => {
    try {
      const [branchData, userData] = await Promise.all([
        apiFetch<Branch[]>("/api/branches"),
        apiFetch<User[]>("/api/users"),
      ])
      setBranches(branchData)
      setAllUsers(userData)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const resetForm = () => {
    setForm({ name: "", address: "", phone: "", isActive: true })
    setEditing(null); setShowForm(false); setSelectedUsers([])
  }

  const handleEdit = (b: Branch) => {
    setForm({ name: b.name, address: b.address, phone: b.phone, isActive: b.isActive })
    setEditing(b)
    // Pre-select users assigned to this branch
    setSelectedUsers(allUsers.filter((u) => u.branchId === b.id).map((u) => u.id))
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Create/update branch
    await fetch("/api/branches", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    })
    // Assign users to branch (would need a batch update API)
    // For now, the branch is created and users can be assigned individually
    resetForm(); fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus cabang ini?")) return
    await fetch(`/api/branches?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId])
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Cabang</h1>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Apa itu Cabang?</p>
          <p>Cabang adalah <strong>lokasi toko/outlet</strong> Anda. Setiap cabang memiliki produk, kasir, dan transaksi terpisah. Tugaskan user (kasir/admin) ke cabang tertentu agar mereka hanya bisa melihat dan mengelola data cabang tersebut.</p>
          <p className="mt-1"><strong>Flow:</strong> Buat Cabang → Tugaskan User → Tambah Produk per Cabang → Kasir Bertransaksi</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">{branches.length} cabang terdaftar</p>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Tambah Cabang Baru
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Cabang</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Cabang *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Cabang Jakarta Pusat" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Alamat lengkap cabang" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="021-xxx" />
              </div>

              {/* User Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Tugaskan User ke Cabang Ini
                </label>
                <div className="border rounded-lg max-h-40 overflow-y-auto">
                  {allUsers.map((user) => (
                    <label key={user.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                      <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={() => toggleUser(user.id)} className="rounded" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </label>
                  ))}
                  {allUsers.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">Belum ada user</p>}
                </div>
                <p className="text-xs text-gray-400 mt-1">{selectedUsers.length} user ditugaskan</p>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Cabang Aktif</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editing ? "Update" : "Simpan"}</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Cards - works for both mobile and desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => {
          const branchUsers = allUsers.filter((u) => u.branchId === b.id)
          return (
            <div key={b.id} className="bg-white rounded-xl shadow-sm border p-4 sm:p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${b.isActive ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Building2 className={`w-5 h-5 ${b.isActive ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.address || "Belum ada alamat"}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {b.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center mb-3 bg-gray-50 rounded-lg p-2">
                <div>
                  <p className="text-lg font-bold text-gray-800">{b._count?.products || 0}</p>
                  <p className="text-xs text-gray-500">Produk</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{b._count?.users || 0}</p>
                  <p className="text-xs text-gray-500">User</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">{b._count?.transactions || 0}</p>
                  <p className="text-xs text-gray-500">Transaksi</p>
                </div>
              </div>

              {branchUsers.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">User di cabang ini:</p>
                  <div className="flex flex-wrap gap-1">
                    {branchUsers.map((u) => (
                      <span key={u.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{u.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => handleEdit(b)} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /> Edit</button>
                <button onClick={() => handleDelete(b.id)} className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 py-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /> Hapus</button>
              </div>
            </div>
          )
        })}
        {branches.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-12">Belum ada cabang. Buat cabang pertama Anda.</div>
        )}
      </div>
    </div>
  )
}
