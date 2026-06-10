"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Shield, User, MapPin, AlertCircle } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/components/Toast"

interface Branch { id: string; name: string; isActive: boolean }
interface UserData {
  id: string; name: string; email: string; role: string; createdAt: string
  branchId: string | null; branch: { id: string; name: string } | null
}

const emptyForm = { name: "", email: "", password: "", role: "CASHIER", branchId: "" }

export default function UsersPage() {
  const { success, error: toastError } = useToast()
  const [users, setUsers] = useState<UserData[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchAll = async () => {
    try {
      const [usersData, branchesData] = await Promise.all([
        apiFetch<UserData[]>("/api/users"),
        apiFetch<Branch[]>("/api/branches"),
      ])
      setUsers(usersData)
      setBranches(branchesData.filter((b) => b.isActive))
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const resetForm = () => {
    setForm(emptyForm)
    setEditing(null)
    setShowForm(false)
    setError("")
  }

  const handleEdit = (user: UserData) => {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      branchId: user.branchId || "",
    })
    setEditing(user)
    setShowForm(true)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.branchId) {
      setError("Cabang wajib dipilih")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/users", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editing?.id,
          password: form.password || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Terjadi kesalahan")
        toastError(data.error || "Gagal menyimpan pengguna")
        return
      }
      success(editing ? "Pengguna berhasil diupdate" : "Pengguna berhasil ditambahkan")
      resetForm()
      fetchAll()
    } catch {
      setError("Gagal menyimpan pengguna")
      toastError("Gagal menyimpan pengguna")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pengguna ini?")) return
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        toastError(data.error || "Gagal menghapus pengguna")
        return
      }
      success("Pengguna berhasil dihapus")
      fetchAll()
    } catch {
      toastError("Gagal menghapus pengguna")
    }
  }

  // Group users per branch for summary
  const branchSummary = branches.map((b) => ({
    ...b,
    userCount: users.filter((u) => u.branchId === b.id).length,
  }))
  const unassigned = users.filter((u) => !u.branchId).length

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pengguna</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Branch Assignment Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {branchSummary.map((b) => (
          <div key={b.id} className="bg-white rounded-lg border shadow-sm p-3 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg flex-shrink-0">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{b.name}</p>
              <p className="text-xs text-gray-500">{b.userCount} pengguna</p>
            </div>
          </div>
        ))}
        {unassigned > 0 && (
          <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800">Belum ditugaskan</p>
              <p className="text-xs text-amber-600">{unassigned} pengguna</p>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-5">{editing ? "Edit" : "Tambah"} Pengguna</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" required minLength={2}
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email" required
                  value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@contoh.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editing && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                  {!editing && <span className="text-red-500"> *</span>}
                </label>
                <input
                  type="password"
                  required={!editing}
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editing ? "••••••••" : "Min. 8 karakter"}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="CASHIER">Kasir</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cabang <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none ${
                      !form.branchId ? "text-gray-400" : "text-gray-800"
                    }`}
                    required
                  >
                    <option value="" disabled>Pilih cabang</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Branch preview */}
              {form.branchId && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>
                    Pengguna akan ditugaskan ke{" "}
                    <strong>{branches.find((b) => b.id === form.branchId)?.name}</strong>
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
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

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pengguna</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Cabang</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Dibuat</th>
                <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${user.role === "ADMIN" ? "bg-purple-100" : "bg-blue-100"}`}>
                        {user.role === "ADMIN"
                          ? <Shield className="w-4 h-4 text-purple-600" />
                          : <User className="w-4 h-4 text-blue-600" />}
                      </div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {user.role === "ADMIN" ? "Admin" : "Kasir"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.branch ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3 h-3" />
                        {user.branch.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Belum ditugaskan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(user.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    Belum ada pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${user.role === "ADMIN" ? "bg-purple-100" : "bg-blue-100"}`}>
                  {user.role === "ADMIN"
                    ? <Shield className="w-4 h-4 text-purple-600" />
                    : <User className="w-4 h-4 text-blue-600" />}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
              }`}>
                {user.role === "ADMIN" ? "Admin" : "Kasir"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                {user.branch ? (
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {user.branch.name}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Belum ditugaskan
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(user)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(user.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && (
          <div className="text-center text-gray-400 py-12">Belum ada pengguna</div>
        )}
      </div>
    </div>
  )
}
