"use client"

import { useEffect, useState } from "react"
import { Plus, Eye, Trash2, Package, AlertCircle, CheckCircle2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number; notes: string
  createdAt: string; receivedAt: string | null
  supplier: { name: string }; creator: { name: string }; _count: { items: number }
}
interface PODetail extends PO {
  items: {
    id: string; quantity: number; cost: number; subtotal: number; itemName: string
    rawMaterial: { name: string; unit: string } | null
  }[]
}
interface Supplier {
  id: string; name: string; isActive: boolean
  supplierMaterials: { id: string; pricePerUnit: number; rawMaterial: { id: string; name: string; unit: string; stock: number } }[]
}
interface FormItem { rawMaterialId: string; quantity: string; cost: string }

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  DRAFT:     { cls: "bg-gray-100 text-gray-700",   label: "Draft" },
  SENT:      { cls: "bg-blue-100 text-blue-700",    label: "Dikirim ke Supplier" },
  RECEIVED:  { cls: "bg-green-100 text-green-700",  label: "Bahan Baku Diterima" },
  CANCELLED: { cls: "bg-red-100 text-red-700",      label: "Dibatalkan" },
}

export default function PurchaseOrdersPage() {
  const { success, error: toastError } = useToast()
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<PODetail | null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])

  // Form state
  const [formSupplier, setFormSupplier] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formItems, setFormItems] = useState<FormItem[]>([])
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fc = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v)

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    const params = filterStatus ? `?status=${filterStatus}` : ""
    apiFetch<PO[]>(`/api/purchase-orders${params}`)
      .then((data) => {
        if (!active) return
        setPos(data)
        setLoading(false)
      })
      .catch((err) => { console.error(err); if (active) setLoading(false) })
    return () => { active = false }
  }, [filterStatus, refreshKey])

  useEffect(() => {
    apiFetch<Supplier[]>("/api/suppliers").then((data) =>
      setSuppliers(data.filter((s) => s.isActive))
    ).catch(console.error)
  }, [])

  // Bahan baku yang tersedia dari supplier yang dipilih
  const selectedSupplier = suppliers.find((s) => s.id === formSupplier)
  const availableMaterials = selectedSupplier?.supplierMaterials || []

  // Ketika supplier berubah, reset items dan auto-fill row pertama
  const handleSupplierChange = (supplierId: string) => {
    setFormSupplier(supplierId)
    setFormItems([])
    setFormError("")
  }

  const addItem = () => {
    setFormItems([...formItems, { rawMaterialId: "", quantity: "", cost: "" }])
  }

  const removeItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof FormItem, value: string) => {
    setFormItems(formItems.map((item, i) => {
      if (i !== idx) return item
      const updated = { ...item, [field]: value }
      // Auto-fill harga dari supplier material
      if (field === "rawMaterialId") {
        const sm = availableMaterials.find((m) => m.rawMaterial.id === value)
        if (sm && sm.pricePerUnit > 0) updated.cost = sm.pricePerUnit.toString()
        else updated.cost = ""
      }
      return updated
    }))
  }

  // Bahan baku yang belum dipilih di row lain
  const getAvailableForRow = (idx: number) =>
    availableMaterials.filter((sm) =>
      !formItems.some((r, i) => i !== idx && r.rawMaterialId === sm.rawMaterial.id)
    )

  const formTotal = formItems.reduce(
    (sum, i) => sum + (parseFloat(i.quantity) || 0) * (parseFloat(i.cost) || 0), 0
  )

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!formSupplier) { setFormError("Pilih supplier terlebih dahulu"); return }

    const items = formItems
      .filter((i) => i.rawMaterialId && parseFloat(i.quantity) > 0)
      .map((i) => ({
        rawMaterialId: i.rawMaterialId,
        quantity: parseFloat(i.quantity),
        cost: parseFloat(i.cost) || 0,
      }))

    if (items.length === 0) { setFormError("Tambahkan minimal 1 bahan baku dengan jumlah > 0"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId: formSupplier, notes: formNotes, items }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || "Gagal membuat PO"); toastError(data.error || "Gagal membuat PO"); return }

      success("Purchase Order berhasil dibuat")
      // Reset form
      setShowCreate(false); setFormSupplier(""); setFormNotes("")
      setFormItems([]); setFormError("")
      setRefreshKey((k) => k + 1)
    } catch { setFormError("Terjadi kesalahan, coba lagi"); toastError("Gagal membuat Purchase Order") }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (id: string, status: string) => {
    if (status === "RECEIVED" && !confirm("Konfirmasi penerimaan? Stok bahan baku akan otomatis bertambah.")) return
    try {
      const res = await fetch("/api/purchase-orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const d = await res.json()
        toastError(d.error || "Gagal update status")
        return
      }
      const statusLabel = STATUS_MAP[status]?.label || status
      success(`Status PO berhasil diubah ke "${statusLabel}"`)
      setRefreshKey((k) => k + 1)
      if (detail?.id === id) {
        const updated = await apiFetch<PODetail>(`/api/purchase-orders?id=${id}`)
        setDetail(updated)
      }
    } catch {
      toastError("Gagal update status PO")
    }
  }

  const viewDetail = async (id: string) => {
    try { setDetail(await apiFetch<PODetail>(`/api/purchase-orders?id=${id}`)) }
    catch (err) { console.error(err) }
  }

  const statusBadge = (status: string) => {
    const s = STATUS_MAP[status] || STATUS_MAP.DRAFT
    return <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Purchase Order Bahan Baku</h1>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto">
          <option value="">Semua Status</option>
          {Object.entries(STATUS_MAP).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button onClick={() => { setShowCreate(true); setFormError("") }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Buat PO Bahan Baku
        </button>
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <h2 className="text-xl font-bold mb-5">Buat Purchase Order</h2>
            <form onSubmit={handleCreatePO} className="space-y-5">

              {formError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
                  <select required value={formSupplier} onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.supplierMaterials.length} bahan)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    placeholder="Catatan tambahan..." />
                </div>
              </div>

              {/* Bahan baku */}
              <div className="border rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Bahan Baku yang Dipesan</p>
                    {formSupplier && availableMaterials.length === 0 && (
                      <p className="text-xs text-amber-600 mt-0.5">
                        Supplier ini belum memiliki bahan baku — tambahkan di halaman Supplier
                      </p>
                    )}
                    {formSupplier && availableMaterials.length > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {availableMaterials.length} bahan baku tersedia dari supplier ini
                      </p>
                    )}
                    {!formSupplier && (
                      <p className="text-xs text-gray-400 mt-0.5">Pilih supplier untuk melihat bahan baku yang tersedia</p>
                    )}
                  </div>
                  <button type="button" onClick={addItem}
                    disabled={!formSupplier || availableMaterials.length === 0 || formItems.length >= availableMaterials.length}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="w-3.5 h-3.5" /> Tambah
                  </button>
                </div>

                <div className="p-4">
                  {formItems.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">
                        {formSupplier
                          ? availableMaterials.length > 0
                            ? 'Klik "Tambah" untuk menambahkan bahan baku'
                            : "Tidak ada bahan baku di supplier ini"
                          : "Pilih supplier dulu"}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Table header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                        <div className="col-span-5">Bahan Baku</div>
                        <div className="col-span-2">Jumlah</div>
                        <div className="col-span-1 text-center">Sat.</div>
                        <div className="col-span-3">Harga/Sat. (Rp)</div>
                        <div className="col-span-1"></div>
                      </div>
                      {formItems.map((item, idx) => {
                        const availForRow = getAvailableForRow(idx)
                        const selectedMat = availableMaterials.find((sm) => sm.rawMaterial.id === item.rawMaterialId)
                        const subtotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.cost) || 0)
                        return (
                          <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg">
                            <div className="col-span-5">
                              <select value={item.rawMaterialId} onChange={(e) => updateItem(idx, "rawMaterialId", e.target.value)}
                                className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="">-- Pilih --</option>
                                {availForRow.map((sm) => (
                                  <option key={sm.rawMaterial.id} value={sm.rawMaterial.id}>
                                    {sm.rawMaterial.name}
                                  </option>
                                ))}
                                {/* Tampilkan yang sudah dipilih row ini */}
                                {item.rawMaterialId && !availForRow.find(sm => sm.rawMaterial.id === item.rawMaterialId) && selectedMat && (
                                  <option value={item.rawMaterialId}>{selectedMat.rawMaterial.name}</option>
                                )}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0" />
                            </div>
                            <div className="col-span-1 text-center text-xs text-gray-500">
                              {selectedMat?.rawMaterial.unit || "-"}
                            </div>
                            <div className="col-span-3">
                              <input type="number" min="0" step="100" value={item.cost} onChange={(e) => updateItem(idx, "cost", e.target.value)}
                                className="w-full border rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="0" />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button type="button" onClick={() => removeItem(idx)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {subtotal > 0 && (
                              <div className="col-span-12 text-right text-xs text-gray-500 -mt-1 pr-1">
                                Subtotal: {fc(subtotal)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {formItems.length > 0 && (
                  <div className="px-4 py-3 bg-gray-50 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-600">{formItems.filter(i => i.rawMaterialId && parseFloat(i.quantity) > 0).length} item valid</span>
                    <span className="text-base font-bold text-gray-800">Total: {fc(formTotal)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
                  {submitting ? "Membuat PO..." : "Buat Purchase Order"}
                </button>
                <button type="button" onClick={() => { setShowCreate(false); setFormItems([]); setFormError("") }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 font-medium">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">No. PO</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pos.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800 text-sm">{po.poNumber}</p>
                    <p className="text-xs text-gray-500">{new Date(po.createdAt).toLocaleDateString("id-ID")} · {po.creator.name}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{po.supplier.name}</td>
                  <td className="px-6 py-4 text-center text-sm">{po._count.items} bahan</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">{fc(po.totalAmount)}</td>
                  <td className="px-6 py-4 text-center">{statusBadge(po.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => viewDetail(po.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Detail">
                        <Eye className="w-4 h-4" />
                      </button>
                      {po.status === "DRAFT" && (
                        <button onClick={() => updateStatus(po.id, "SENT")}
                          className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded hover:bg-blue-100">
                          Kirim
                        </button>
                      )}
                      {po.status === "SENT" && (
                        <button onClick={() => updateStatus(po.id, "RECEIVED")}
                          className="text-xs bg-green-50 text-green-600 px-2.5 py-1 rounded hover:bg-green-100">
                          Terima
                        </button>
                      )}
                      {(po.status === "DRAFT" || po.status === "SENT") && (
                        <button onClick={() => updateStatus(po.id, "CANCELLED")}
                          className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded hover:bg-red-100">
                          Batal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada Purchase Order</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {pos.map((po) => (
          <div key={po.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{po.poNumber}</p>
                <p className="text-xs text-gray-500">{po.supplier.name} · {new Date(po.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
              {statusBadge(po.status)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-xs text-gray-500">{po._count.items} bahan · {po.creator.name}</span>
              <span className="font-bold text-sm text-blue-600">{fc(po.totalAmount)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => viewDetail(po.id)} className="flex-1 text-xs text-blue-600 py-1.5 bg-blue-50 rounded-lg text-center">Detail</button>
              {po.status === "SENT" && (
                <button onClick={() => updateStatus(po.id, "RECEIVED")}
                  className="flex-1 text-xs bg-green-50 text-green-600 py-1.5 rounded-lg text-center">
                  Terima Barang
                </button>
              )}
            </div>
          </div>
        ))}
        {pos.length === 0 && <div className="text-center text-gray-400 py-12">Belum ada Purchase Order</div>}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{detail.poNumber}</h2>
                <p className="text-sm text-gray-500">{detail.supplier.name}</p>
              </div>
              {statusBadge(detail.status)}
            </div>

            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Dibuat oleh</span>
                <span className="font-medium">{detail.creator.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal</span>
                <span>{new Date(detail.createdAt).toLocaleString("id-ID")}</span>
              </div>
              {detail.receivedAt && (
                <div className="flex justify-between text-green-700">
                  <span>Diterima</span>
                  <span className="font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {new Date(detail.receivedAt).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              {detail.notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Catatan</span>
                  <span className="text-right max-w-[60%]">{detail.notes}</span>
                </div>
              )}
            </div>

            <h3 className="font-semibold text-sm mb-2">Bahan Baku Dipesan</h3>
            <div className="space-y-2 mb-4">
              {detail.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{item.rawMaterial?.name || item.itemName}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {item.rawMaterial?.unit || "pcs"} × {fc(item.cost)}
                    </p>
                  </div>
                  <p className="font-semibold">{fc(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex justify-between font-bold text-lg mb-4">
              <span>Total</span><span>{fc(detail.totalAmount)}</span>
            </div>

            <div className="flex gap-2">
              {detail.status === "DRAFT" && (
                <button onClick={() => updateStatus(detail.id, "SENT")}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                  Kirim ke Supplier
                </button>
              )}
              {detail.status === "SENT" && (
                <button onClick={() => updateStatus(detail.id, "RECEIVED")}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                  Konfirmasi Terima Barang
                </button>
              )}
              <button onClick={() => setDetail(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
