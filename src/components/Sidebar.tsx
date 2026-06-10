"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Receipt,
  BarChart3,
  Users,
  LogOut,
  Menu,
  X,
  Building2,
  Truck,
  ClipboardList,
  UserCheck,
  ScrollText,
  Box,
  MapPin,
} from "lucide-react"
import Logo from "./Logo"

// Menu untuk ADMIN - semua fitur kecuali shift
const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "Kasir / POS", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Produk", icon: Package },
  { href: "/dashboard/categories", label: "Kategori", icon: FolderOpen },
  { href: "/dashboard/transactions", label: "Transaksi", icon: Receipt },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/customers", label: "Customer", icon: UserCheck },
  { href: "/dashboard/suppliers", label: "Supplier", icon: Truck },
  { href: "/dashboard/raw-materials", label: "Bahan Baku", icon: Box },
  { href: "/dashboard/purchase-orders", label: "PO Bahan Baku", icon: ClipboardList },
  { href: "/dashboard/branches", label: "Cabang", icon: Building2 },
  { href: "/dashboard/users", label: "Pengguna", icon: Users },
  { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText },
]

// Menu untuk KASIR - hanya fitur kasir
const cashierNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "Kasir / POS", icon: ShoppingCart },
  { href: "/dashboard/transactions", label: "Transaksi Saya", icon: Receipt },
  { href: "/dashboard/customers", label: "Customer", icon: UserCheck },
  { href: "/dashboard/reports", label: "Laporan Saya", icon: BarChart3 },
]

type SessionUser = {
  name?: string | null
  email?: string | null
  role?: string
  branchId?: string
  branchName?: string
}

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const user = session?.user as SessionUser | undefined
  const isAdmin = user?.role === "ADMIN"
  const navItems = isAdmin ? adminNavItems : cashierNavItems

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/login")
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 flex flex-col`}
      >
        <div className="flex items-center gap-2.5 px-6 py-5 border-b">
          <Logo size={32} />
          <span className="text-xl font-bold text-gray-800">El-Kasir</span>
          <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="px-4 py-2 mb-2 space-y-1">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <span className="inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {isAdmin ? "Admin" : "Kasir"}
              </span>
              {user?.branchName && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">
                  <MapPin className="w-2.5 h-2.5" />
                  {user.branchName}
                </span>
              )}
              {!user?.branchName && !isAdmin && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  <MapPin className="w-2.5 h-2.5" />
                  Belum ada cabang
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white shadow-sm px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between lg:justify-between">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>

          {/* Branch badge di header */}
          <div className="flex items-center gap-2">
            {user?.branchName ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs sm:text-sm font-medium">{user.branchName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-500 px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-xs sm:text-sm">
                  {isAdmin ? "Semua Cabang" : "Belum ada cabang"}
                </span>
              </div>
            )}
          </div>

          <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
