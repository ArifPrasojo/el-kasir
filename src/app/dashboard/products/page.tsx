"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

interface Product {
  id: string
  name: string
  description: string
  sku?: string | null
  price: number
  cost: number
  stock: number
  categoryId: string
  isActive: boolean
  category: { id: string; name: string }
}

interface Category {
  id: string
  name: string
}

export default function ProductsPage() {
  const { data: session } = useSession()
  const { success, error: toastError } = useToast()
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN"
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState("")

  const [form, setForm] = useState({
    name: "", description: "", sku: "", price: "", cost: "", stock: "", categoryId: "", isActive: true,
  })

  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([
      apiFetch<Product[]>(`/api/products?search=${search}&categoryId=${filterCategory}`),
      apiFetch<Category[]>("/api/categories"),
    ])
      .then(([products, categories]) => {
        if (!active) return
        setProducts(products)
        setCategories(categories)
        setLoading(false)
      })
      .catch((err) => { console.error(err); if (active) setLoading(false) })
    return () => { active = false }
  }, [search, filterCategory, refreshKey])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount)

  const resetForm = () => {
    setForm({ name: "", description: "", sku: "", price: "", cost: "", stock: "", categoryId: categories[0]?.id || "", isActive: true })
    setEditing(null)
    setShowForm(false)
  }

  const handleEdit = (product: Product) => {
    setForm({
      name: product.name, description: product.description, sku: product.sku || "",
      price: product.price.toString(), cost: product.cost.toString(),
      stock: product.stock.toString(), categoryId: product.categoryId,
      isActive: product.isActive,
    })
    setEditing(product)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = editing ? "PUT" : "POST"
    try {
      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menyimpan produk")
        return
      }
      success(editing ? "Produk berhasil diupdate" : "Produk berhasil ditambahkan")
      resetForm()
      setRefreshKey((k) => k + 1)
    } catch {
      toastError("Gagal menyimpan produk")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus produk ini?")) return
    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menghapus produk")
        return
      }
      success("Produk berhasil dihapus")
      setRefreshKey((k) => k + 1)
    } catch {
      toastError("Gagal menghapus produk")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Produk</h1>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Plus className="w-4 h-4" /> Tambah Produk
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm">
          <option value="">Semua Kategori</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Produk</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU / Barcode <span className="text-xs font-normal text-gray-400">(opsional — untuk scanner)</span></label>
                <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: 8991234567890" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                  <input type="number" required min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal</label>
                  <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok</label>
                  <input type="number" required min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                    {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Aktif</label>
              </div>
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

      {/* Products Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="text-left px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="text-right px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Harga</th>
                <th className="text-right px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Modal</th>
                <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                {isAdmin && <th className="text-center px-4 lg:px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4">
                    <p className="font-medium text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.description}</p>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-sm text-gray-600">{product.category.name}</td>
                  <td className="px-4 lg:px-6 py-4 text-right text-sm font-medium">{formatCurrency(product.price)}</td>
                  <td className="px-4 lg:px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(product.cost)}</td>
                  <td className="px-4 lg:px-6 py-4 text-center">
                    <span className={`text-sm font-medium ${product.stock <= 5 ? "text-red-600" : "text-gray-800"}`}>{product.stock}</span>
                  </td>
                  <td className="px-4 lg:px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {product.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 lg:px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400">Belum ada produk</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Products Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{product.name}</p>
                <p className="text-xs text-gray-500">{product.category.name}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${product.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                {product.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
            {product.description && <p className="text-xs text-gray-400 mb-3">{product.description}</p>}
            <div className="grid grid-cols-3 gap-2 text-sm mb-3">
              <div>
                <p className="text-xs text-gray-500">Harga</p>
                <p className="font-semibold">{formatCurrency(product.price)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Modal</p>
                <p className="text-gray-600">{formatCurrency(product.cost)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stok</p>
                <p className={`font-semibold ${product.stock <= 5 ? "text-red-600" : ""}`}>{product.stock}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-2 pt-2 border-t">
                <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center gap-1 text-sm text-blue-600 py-1.5 hover:bg-blue-50 rounded-lg">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
                <button onClick={() => handleDelete(product.id)} className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 py-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              </div>
            )}
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center text-gray-400 py-12">Belum ada produk</div>
        )}
      </div>
    </div>
  )
}
