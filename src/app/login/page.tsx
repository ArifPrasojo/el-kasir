"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Building2 } from "lucide-react"
import Logo from "@/components/Logo"

interface Branch { id: string; name: string }

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])

  useEffect(() => {
    // Pre-fetch branches for selection
    fetch("/api/branches").then((r) => r.ok ? r.json() : []).then(setBranches).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Email atau password salah")
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <Logo size={56} />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">El-Kasir</h1>
          <p className="text-gray-500 text-sm">Sistem Kasir Modern</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@elkasir.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10"
                placeholder="••••••••" required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                Bekerja di Cabang
              </label>
              <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">Pilih cabang tempat Anda bekerja saat ini</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-5 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 font-medium mb-1.5">Akun Demo:</p>
          <div className="text-xs text-gray-600 space-y-0.5">
            <p>Admin: admin@elkasir.com / admin123</p>
            <p>Kasir: kasir@elkasir.com / kasir123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
