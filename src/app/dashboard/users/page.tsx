"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Shield, User } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

interface UserData {
  id: string; name: string; email: string; role: string; createdAt: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<UserData | null>(null)
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CASHIER" })

  const fetchUsers = async () => {
    try {
      const data = await apiFetch<UserData[]>("/api/users")
      setUsers(data)
    } catch (err) {
      console.error("Failed to fetch users:", err)
    }
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const resetForm = () => {
    setForm({ name: "", email: "", password: "", role: "CASHIER" })
    setEditing(null)
    setShowForm(false)
  }

  const handleEdit = (user: UserData) => {
    setForm({ name: user.name, email: user.email, password: "", role: user.role })
    setEditing(user)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/users", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id, password: form.password || undefined }),
    })
    resetForm()
    fetchUsers()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus pengguna ini?")) return
    await fetch(`/api/users?id=${id}`, { method: "DELETE" })
    fetchUsers()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Pengguna</h1>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editing ? "Edit" : "Tambah"} Pengguna</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password {editing && <span className="text-gray-400">(kosongkan jika tidak diubah)</span>}
                </label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder={editing ? "••••••••" : "password123"} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="ADMIN">Admin</option>
                  <option value="CASHIER">Kasir</option>
                </select>
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
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-center px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
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
                      {user.role === "ADMIN" ? <Shield className="w-4 h-4 text-purple-600" /> : <User className="w-4 h-4 text-blue-600" />}
                    </div>
                    <span className="font-medium text-gray-800">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {user.role === "ADMIN" ? "Admin" : "Kasir"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(user.createdAt).toLocaleDateString("id-ID")}</td>
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
