"use client"

import { useEffect, useState } from "react"
import { Plus, Eye, CheckCircle, XCircle, Clock, Send, Info, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface PO {
  id: string; poNumber: string; status: string; totalAmount: number; notes: string; createdAt: string; receivedAt: string | null
  supplier: { name: string }; creator: { name: string }; _count: { items: number }
}
interface PODetail extends PO {
  items: { id: string; quantity: number; cost: number; subtotal: number; product: { name: string } }[]
}
interface Supplier { id: string; name: string }
interface Product { id: string; name: string; cost: number; stock: number }

export default function PurchaseOrdersPage() {
  const [pos, setPos] = useState<PO[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<PODetail | null>(null)
  const [filterStatus, setFilterStatus] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Create form state
  const [formSupplier, setFormSupplier] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formItems, setFormItems] = useState<{ productId: string; quantity: string; cost: string }[]>([])

  const fc = (amount: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const fetchPOs = async () => {
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ""
      const data = await apiFetch<PO[]>(`/api/purchase-orders${params}`)
      setPos(data)
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  useEffect(() => { fetchPOs() }, [filterStatus])
  useEffect(() => {
    apiFetch<Supplier[]>("/api/suppliers").then(setSuppliers).catch(console.error)
    apiFetch<Product[]>("/api/products").then(setProducts).catch(console.error)
  }, [])

  const viewDetail = async (id: string) => {
    try { const data = await apiFetch<PODetail>(`/api/purchase-orders?id=${id}`); setDetail(data) }
    catch (err) { console.error(err) }
  }

  const updateStatus = async (id: string, status: string) => {
    if (status === "RECEIVED" && !confirm("Konfirmasi penerimaan barang? Stok produk akan otomatis bertambah sesuai jumlah di PO.")) return
    await fetch("/api/purchase-orders", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    fetchPOs(); setDetail(null)
  }

  const addItem = () => setFormItems([...formItems, { productId: "", quantity: "", cost: "" }])
  const removeItem = (idx: number) => setFormItems(formItems.filter((_, i) => i !== idx))
  const updateItem = (idx: number, field: string, value: string) => {
    setFormItems(formItems.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault()
    const items = formItems
      .filter((i) => i.productId && i.quantity)
      .map((i) => ({
        productId: i.productId,
        quantity: parseInt(i.quantity) || 0,
        cost: parseFloat(i.cost) || 0,
      }))
    if (items.length === 0) { alert("Tambahkan minimal 1 item"); return }

    await fetch("/api/purchase-orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierId: formSupplier, notes: formNotes, items }),
    })
    setShowCreate(false); setFormSupplier(""); setFormNotes(""); setFormItems([])
    fetchPOs()
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { cls: string; label: string }> = {
      DRAFT: { cls: "bg-gray-100 text-gray-700", label: "Draft" },
      SENT: { cls: "bg-blue-100 text-blue-700", label: "Dikirim ke Supplier" },
      RECEIVED: { cls: "bg-green-100 text-green-700", label: "Barang Diterima" },
      CANCELLED: { cls: "bg-red-100 text-red-700", label: "Dibatalkan" },
    }
    const s = map[status] || map.DRAFT
    return <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${s.cls}`}>{s.label}</span>
  }

  const formTotal = formItems.reduce((sum, i) => sum + (parseInt(i.quantity) || 0) * (parseFloat(i.cost) || 0), 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Purchase Order (PO)</h1>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Apa itu Purchase Order?</p>
          <p>PO adalah <strong>surat pesanan resmi ke supplier</strong> untuk membeli barang. Data produk dan supplier diambil dari yang sudah Anda daftarkan di menu Supplier dan Produk.</p>
          <p className="mt-1"><strong>Flow:</strong> Buat PO (Draft) → Kirim ke Supplier (Sent) → Barang Datang & Diterima (Received) → <strong>Stok Bertambah Otomatis</strong></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Dikirim ke Supplier</option>
          <option value="RECEIVED">Barang Diterima</option>
          <option value="CANCELLED">Dibatalkan</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <Plus className="w-4 h-4" /> Buat PO Baru
        </button>
      </div>

      {/* Create PO Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Buat Purchase Order Baru</h2>
            <form onSubmit={handleCreatePO} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Supplier *</label>
                  <select required value={formSupplier} onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">-- Pilih Supplier --</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
                  <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Catatan tambahan..." />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Item Pesanan</label>
                  <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah Item</button>
                </div>
                {formItems.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-lg text-gray-400 text-sm">
                    Klik "Tambah Item" untuk menambahkan produk yang ingin dipesan
                  </div>
                )}
                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-end bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Produk</label>
                        <select value={item.productId} onChange={(e) => updateItem(idx, "productId", e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                          <option value="">-- Pilih --</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>)}
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="text-xs text-gray-500">Jumlah</label>
                        <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div className="w-28">
                        <label className="text-xs text-gray-500">Harga Modal</label>
                        <input type="number" min="0" value={item.cost} onChange={(e) => updateItem(idx, "cost", e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded mb-0.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {formItems.length > 0 && (
                  <div className="text-right mt-2 text-sm font-bold text-gray-800">
                    Total: {fc(formTotal)}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Buat Purchase Order</button>
                <button type="button" onClick={() => { setShowCreate(false); setFormItems([]) }} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
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
                  <td className="px-6 py-4 text-sm text-gray-600">{po.supplier.name}</td>
                  <td className="px-6 py-4 text-center text-sm">{po._count.items}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">{fc(po.totalAmount)}</td>
                  <td className="px-6 py-4 text-center">{statusBadge(po.status)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => viewDetail(po.id)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Eye className="w-4 h-4" /></button>
                      {po.status === "DRAFT" && <button onClick={() => updateStatus(po.id, "SENT")} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Kirim</button>}
                      {po.status === "SENT" && <button onClick={() => updateStatus(po.id, "RECEIVED")} className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded hover:bg-green-100">Terima</button>}
                      {(po.status === "DRAFT" || po.status === "SENT") && <button onClick={() => updateStatus(po.id, "CANCELLED")} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">Batal</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">Belum ada Purchase Order. Klik "Buat PO Baru" untuk memulai.</td></tr>}
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
                <p className="font-medium text-gray-800 text-sm">{po.poNumber}</p>
                <p className="text-xs text-gray-500">{po.supplier.name} · {new Date(po.createdAt).toLocaleDateString("id-ID")}</p>
              </div>
              {statusBadge(po.status)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <span className="text-xs text-gray-500">{po._count.items} item · {po.creator.name}</span>
              <span className="font-bold text-sm text-blue-600">{fc(po.totalAmount)}</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => viewDetail(po.id)} className="flex-1 text-xs text-blue-600 py-1.5 bg-blue-50 rounded-lg">Detail</button>
              {po.status === "SENT" && <button onClick={() => updateStatus(po.id, "RECEIVED")} className="flex-1 text-xs bg-green-50 text-green-600 py-1.5 rounded-lg">Terima Barang</button>}
            </div>
          </div>
        ))}
        {pos.length === 0 && <div className="text-center text-gray-400 py-12">Belum ada Purchase Order</div>}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">{detail.poNumber}</h2>
                <p className="text-sm text-gray-500">{detail.supplier.name}</p>
              </div>
              {statusBadge(detail.status)}
            </div>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-gray-500">Dibuat</span><span>{new Date(detail.createdAt).toLocaleString("id-ID")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Oleh</span><span>{detail.creator.name}</span></div>
              {detail.receivedAt && <div className="flex justify-between"><span className="text-gray-500">Diterima</span><span>{new Date(detail.receivedAt).toLocaleString("id-ID")}</span></div>}
            </div>
            <div className="border-t pt-3">
              <h3 className="font-medium mb-2 text-sm">Item yang Dipesan</h3>
              <div className="space-y-2">
                {detail.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} x {fc(item.cost)}</p>
                    </div>
                    <p className="font-semibold">{fc(item.subtotal)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t mt-3 pt-3 flex justify-between font-bold text-lg">
              <span>Total</span><span>{fc(detail.totalAmount)}</span>
            </div>
            <div className="flex gap-2 mt-4">
              {detail.status === "SENT" && <button onClick={() => updateStatus(detail.id, "RECEIVED")} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">Konfirmasi Terima Barang</button>}
              <button onClick={() => setDetail(null)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
