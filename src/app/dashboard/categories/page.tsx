"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

interface Category {
  id: string
  name: string
  description: string
  _count?: { products: number }
}

export default function CategoriesPage() {
  const { data: session } = useSession()
  const { success, error: toastError } = useToast()
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN"
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: "", description: "" })
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let active = true
    apiFetch<Category[]>("/api/categories")
      .then((data) => {
        if (!active) return
        setCategories(data)
        setLoading(false)
      })
      .catch((err) => { console.error(err); if (active) setLoading(false) })
    return () => { active = false }
  }, [refreshKey])

  const resetForm = () => {
    setForm({ name: "", description: "" })
    setEditing(null)
    setShowForm(false)
  }

  const handleEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description })
    setEditing(cat)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch("/api/categories", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, id: editing?.id }),
      })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menyimpan kategori")
        return
      }
      success(editing ? "Kategori berhasil diupdate" : "Kategori berhasil ditambahkan")
      resetForm()
      setRefreshKey((k) => k + 1)
    } catch {
      toastError("Gagal menyimpan kategori")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus kategori ini?")) return
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toastError(data.error || "Gagal menghapus kategori")
        return
      }
      success("Kategori berhasil dihapus")
      setRefreshKey((k) => k + 1)
    } catch {
      toastError("Gagal menghapus kategori")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Kategori</h1>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tambah Kategori
          </button>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Kategori</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kategori</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" rows={2} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">{editing ? "Update" : "Simpan"}</button>
                <button type="button" onClick={resetForm} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Deskripsi</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Jumlah Produk</th>
              {isAdmin && <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-800">{cat.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{cat.description || "-"}</td>
                <td className="px-6 py-4 text-center text-sm">{cat._count?.products || 0}</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(cat)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Belum ada kategori</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
