"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Truck, Info, ShoppingBag } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface Supplier {
  id: string; name: string; email: string; phone: string; address: string; isActive: boolean
  _count?: { purchaseOrders: number }; branch?: { name: string } | null
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", isActive: true })

  const fetchSuppliers = async () => {
    try { const data = await apiFetch<Supplier[]>("/api/suppliers"); setSuppliers(data) }
    catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchSuppliers() }, [])

  const resetForm = () => { setForm({ name: "", email: "", phone: "", address: "", isActive: true }); setEditing(null); setShowForm(false) }

  const handleEdit = (s: Supplier) => {
    setForm({ name: s.name, email: s.email, phone: s.phone, address: s.address, isActive: s.isActive })
    setEditing(s); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/suppliers", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    })
    resetForm(); fetchSuppliers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus supplier ini?")) return
    await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" })
    fetchSuppliers()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Supplier</h1>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Apa itu Supplier?</p>
          <p>Supplier adalah <strong>pemasok/perusahaan yang menyediakan barang</strong> untuk toko Anda. Tambahkan supplier di sini, lalu buat <strong>Purchase Order (PO)</strong> untuk memesan barang dari mereka.</p>
          <p className="mt-1"><strong>Flow:</strong> Tambah Supplier → Buat Purchase Order → Terima Barang → Stok Bertambah Otomatis</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">{suppliers.length} supplier terdaftar</p>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Tambah Supplier Baru
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Supplier</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier / Perusahaan *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: PT Sumber Pangan" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@supplier.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="021-xxx" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} placeholder="Alamat lengkap supplier" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editing ? "Update" : "Simpan"}</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kontak</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jumlah PO</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{s.phone || "-"}</p>
                    <p className="text-xs text-gray-400">{s.email || "-"}</p>
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-medium">{s._count?.purchaseOrders || 0} PO</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Belum ada supplier. Tambahkan supplier untuk mulai membuat Purchase Order.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start gap-2 mb-2">
              <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-500">{s.phone} {s.email ? `· ${s.email}` : ""}</p>
                {s.address && <p className="text-xs text-gray-400 mt-1">{s.address}</p>}
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s._count?.purchaseOrders || 0} PO</span>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button onClick={() => handleEdit(s)} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /> Edit</button>
              <button onClick={() => handleDelete(s.id)} className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 py-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /> Hapus</button>
            </div>
          </div>
        ))}
        {suppliers.length === 0 && <div className="text-center text-gray-400 py-12">Belum ada supplier</div>}
      </div>
    </div>
  )
}
