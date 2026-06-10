"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Truck, Package, X, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

interface RawMaterial { id: string; name: string; unit: string; stock: number }
interface SupplierMaterial {
  id: string
  pricePerUnit: number
  rawMaterial: { id: string; name: string; unit: string }
}
interface Supplier {
  id: string; name: string; email: string; phone: string; address: string; isActive: boolean
  _count?: { purchaseOrders: number }
  branch?: { name: string } | null
  supplierMaterials: SupplierMaterial[]
}

const emptyForm = { name: "", email: "", phone: "", address: "", isActive: true }
type MaterialRow = { rawMaterialId: string; pricePerUnit: string }

export default function SuppliersPage() {
  const { success, error: toastError } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [materialRows, setMaterialRows] = useState<MaterialRow[]>([])
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchAll = async () => {
    try {
      const [suppliersData, materialsData] = await Promise.all([
        apiFetch<Supplier[]>("/api/suppliers"),
        apiFetch<RawMaterial[]>("/api/raw-materials"),
      ])
      setSuppliers(suppliersData)
      setRawMaterials(materialsData)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const resetForm = () => {
    setForm(emptyForm); setMaterialRows([]); setEditing(null)
    setShowForm(false); setError("")
  }

  const handleEdit = (s: Supplier) => {
    setForm({ name: s.name, email: s.email, phone: s.phone, address: s.address, isActive: s.isActive })
    setMaterialRows(s.supplierMaterials.map((sm) => ({
      rawMaterialId: sm.rawMaterial.id,
      pricePerUnit: sm.pricePerUnit.toString(),
    })))
    setEditing(s); setShowForm(true); setError("")
  }

  const addMaterialRow = () => {
    setMaterialRows([...materialRows, { rawMaterialId: "", pricePerUnit: "" }])
  }

  const removeMaterialRow = (idx: number) => {
    setMaterialRows(materialRows.filter((_, i) => i !== idx))
  }

  const updateMaterialRow = (idx: number, field: keyof MaterialRow, value: string) => {
    const updated = [...materialRows]
    updated[idx] = { ...updated[idx], [field]: value }
    // Auto-fill harga dari costPerUnit bahan baku
    if (field === "rawMaterialId") {
      const mat = rawMaterials.find((m) => m.id === value)
      if (mat) updated[idx].pricePerUnit = ""
    }
    setMaterialRows(updated)
  }

  // Cek duplikat bahan baku dalam form
  const hasDuplicateMaterial = () => {
    const ids = materialRows.map((r) => r.rawMaterialId).filter(Boolean)
    return ids.length !== new Set(ids).size
  }

  // Bahan baku yang belum dipilih di row lain
  const availableMaterials = (currentIdx: number) =>
    rawMaterials.filter((m) =>
      !materialRows.some((r, i) => i !== currentIdx && r.rawMaterialId === m.id)
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (hasDuplicateMaterial()) {
      setError("Terdapat bahan baku yang dipilih lebih dari satu kali")
      return
    }

    const materials = materialRows
      .filter((r) => r.rawMaterialId)
      .map((r) => ({ rawMaterialId: r.rawMaterialId, pricePerUnit: parseFloat(r.pricePerUnit) || 0 }))

    setSubmitting(true)
    try {
      const res = await fetch("/api/suppliers", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id, materials }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Terjadi kesalahan"); toastError(data.error || "Gagal menyimpan supplier"); return }
      success(editing ? "Supplier berhasil diupdate" : "Supplier berhasil ditambahkan")
      resetForm(); fetchAll()
    } catch { setError("Gagal menyimpan supplier"); toastError("Gagal menyimpan supplier") }
    finally { setSubmitting(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus supplier ini? Semua data bahan baku terkait juga akan dihapus.")) return
    try {
      const res = await fetch(`/api/suppliers?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toastError(data.error || "Gagal menghapus supplier"); return }
      success("Supplier berhasil dihapus")
      fetchAll()
    } catch {
      toastError("Gagal menghapus supplier")
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Manajemen Supplier</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Tambah Supplier
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-5">{editing ? "Edit" : "Tambah"} Supplier</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              {/* Info supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier / Perusahaan <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: PT Sumber Pangan" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="email@supplier.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="021-xxx" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2}
                    placeholder="Alamat lengkap supplier" />
                </div>
              </div>

              {/* Bahan baku yang tersedia di supplier */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800">Bahan Baku yang Disediakan</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Tentukan bahan baku apa saja yang bisa dipesan dari supplier ini</p>
                  </div>
                  <button type="button" onClick={addMaterialRow}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>

                {materialRows.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Belum ada bahan baku</p>
                    <p className="text-xs text-gray-400">Klik "Tambah" untuk menambahkan</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                      <div className="col-span-6">Bahan Baku</div>
                      <div className="col-span-4">Harga per Satuan (Rp)</div>
                      <div className="col-span-1">Satuan</div>
                      <div className="col-span-1"></div>
                    </div>
                    {materialRows.map((row, idx) => {
                      const selectedMat = rawMaterials.find((m) => m.id === row.rawMaterialId)
                      return (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                          <div className="col-span-6">
                            <select
                              value={row.rawMaterialId}
                              onChange={(e) => updateMaterialRow(idx, "rawMaterialId", e.target.value)}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="">-- Pilih --</option>
                              {availableMaterials(idx).map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                              {/* Tampilkan yang sudah dipilih di row ini */}
                              {row.rawMaterialId && !availableMaterials(idx).find(m => m.id === row.rawMaterialId) && (
                                <option value={row.rawMaterialId}>{selectedMat?.name}</option>
                              )}
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number" min="0" step="100"
                              value={row.pricePerUnit}
                              onChange={(e) => updateMaterialRow(idx, "pricePerUnit", e.target.value)}
                              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-1 text-xs text-gray-500 text-center">
                            {selectedMat?.unit || "-"}
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <button type="button" onClick={() => removeMaterialRow(idx)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {submitting ? "Menyimpan..." : editing ? "Update" : "Simpan"}
                </button>
                <button type="button" onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier List */}
      <div className="space-y-3">
        {suppliers.length === 0 && (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
            <Truck className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Belum ada supplier. Tambahkan supplier untuk mulai membuat Purchase Order.</p>
          </div>
        )}

        {suppliers.map((s) => {
          const isExpanded = expandedId === s.id
          return (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-3 p-4">
                <div className="bg-blue-100 p-2.5 rounded-lg flex-shrink-0">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 flex-wrap">
                    {s.phone && <span>{s.phone}</span>}
                    {s.email && <span>{s.email}</span>}
                    <span className="text-blue-600 font-medium">{s._count?.purchaseOrders || 0} PO</span>
                    <span className="text-emerald-600 font-medium">{s.supplierMaterials.length} bahan baku</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setExpandedId(isExpanded ? null : s.id)}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 rounded" title={isExpanded ? "Sembunyikan" : "Lihat bahan baku"}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleEdit(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable: daftar bahan baku */}
              {isExpanded && (
                <div className="border-t bg-gray-50 px-4 py-3">
                  {s.supplierMaterials.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Belum ada bahan baku — klik Edit untuk menambahkan
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bahan Baku Tersedia</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {s.supplierMaterials.map((sm) => (
                          <div key={sm.id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{sm.rawMaterial.name}</p>
                              <p className="text-xs text-gray-500">
                                {sm.pricePerUnit > 0
                                  ? `Rp ${sm.pricePerUnit.toLocaleString("id-ID")} / ${sm.rawMaterial.unit}`
                                  : `per ${sm.rawMaterial.unit}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
