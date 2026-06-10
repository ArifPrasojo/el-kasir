"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Package, Info, AlertTriangle } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface RawMaterial {
  id: string; name: string; unit: string; stock: number; costPerUnit: number; minStock: number; isActive: boolean; createdAt: string
  branch?: { name: string } | null
}

export default function RawMaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<RawMaterial | null>(null)
  const [form, setForm] = useState({ name: "", unit: "kg", stock: "", costPerUnit: "", minStock: "5", isActive: true })

  const fc = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchMaterials = async () => {
    try { const data = await apiFetch<RawMaterial[]>("/api/raw-materials"); setMaterials(data) }
    catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchMaterials() }, [])

  const resetForm = () => {
    setForm({ name: "", unit: "kg", stock: "", costPerUnit: "", minStock: "5", isActive: true })
    setEditing(null); setShowForm(false)
  }

  const handleEdit = (m: RawMaterial) => {
    setForm({
      name: m.name, unit: m.unit, stock: m.stock.toString(),
      costPerUnit: m.costPerUnit.toString(), minStock: m.minStock.toString(), isActive: m.isActive,
    })
    setEditing(m); setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/raw-materials", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    })
    resetForm(); fetchMaterials()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus bahan baku ini?")) return
    await fetch(`/api/raw-materials?id=${id}`, { method: "DELETE" })
    fetchMaterials()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  const lowStockItems = materials.filter((m) => m.stock <= m.minStock && m.isActive)

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Bahan Baku</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Apa itu Bahan Baku?</p>
          <p>Bahan baku adalah <strong>material mentah yang dibeli dari supplier</strong> untuk digunakan dalam proses produksi. Stok bahan baku bertambah saat <strong>Purchase Order diterima</strong>, dan berkurang saat digunakan untuk produksi.</p>
          <p className="mt-1"><strong>Flow:</strong> Daftar Bahan Baku → Buat PO ke Supplier → Terima Barang → Stok Bahan Baku Bertambah</p>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="font-semibold text-red-800 text-sm">Stok Rendah! {lowStockItems.length} bahan baku perlu di-restock</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((m) => (
              <span key={m.id} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {m.name}: {m.stock} {m.unit} (min: {m.minStock})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500">{materials.length} bahan baku terdaftar</p>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Tambah Bahan Baku
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Bahan Baku</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bahan Baku *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Tepung Terigu" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter</option>
                    <option value="ml">Mililiter (ml)</option>
                    <option value="pcs">Pcs/Buah</option>
                    <option value="box">Box/Dus</option>
                    <option value="pack">Pack</option>
                    <option value="botol">Botol</option>
                    <option value="lusin">Lusin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Saat Ini</label>
                  <input type="number" min="0" step="0.01" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga per Satuan</label>
                  <input type="number" min="0" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimum</label>
                  <input type="number" min="0" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="5" />
                  <p className="text-xs text-gray-400 mt-0.5">Alert jika stok di bawah ini</p>
                </div>
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
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Bahan Baku</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Satuan</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Harga/Satuan</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Min. Stok</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-800">{m.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-semibold ${m.stock <= m.minStock ? "text-red-600" : "text-gray-800"}`}>
                      {m.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{m.unit}</td>
                  <td className="px-6 py-4 text-right text-sm">{fc(m.costPerUnit)}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{m.minStock}</td>
                  <td className="px-6 py-4 text-center">
                    {m.stock <= m.minStock ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">Stok Rendah</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Cukup</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(m)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {materials.length === 0 && <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Belum ada bahan baku. Tambahkan bahan baku untuk mulai membuat Purchase Order.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {materials.map((m) => (
          <div key={m.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-500">{fc(m.costPerUnit)} / {m.unit}</p>
                </div>
              </div>
              {m.stock <= m.minStock ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">Rendah</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Cukup</span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-lg p-2 mb-3">
              <div>
                <p className={`text-lg font-bold ${m.stock <= m.minStock ? "text-red-600" : "text-gray-800"}`}>{m.stock}</p>
                <p className="text-xs text-gray-500">{m.unit}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{m.minStock}</p>
                <p className="text-xs text-gray-500">Min</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-800">{fc(m.costPerUnit * m.stock)}</p>
                <p className="text-xs text-gray-500">Nilai</p>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button onClick={() => handleEdit(m)} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg"><Pencil className="w-4 h-4" /> Edit</button>
              <button onClick={() => handleDelete(m.id)} className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 py-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /> Hapus</button>
            </div>
          </div>
        ))}
        {materials.length === 0 && <div className="text-center text-gray-400 py-12">Belum ada bahan baku</div>}
      </div>
    </div>
  )
}
