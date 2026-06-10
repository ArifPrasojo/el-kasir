"use client"

import { useState, useEffect } from "react"
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
  Clock,
  ScrollText,
} from "lucide-react"
import Logo from "./Logo"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/pos", label: "Kasir / POS", icon: ShoppingCart },
  { href: "/dashboard/products", label: "Produk", icon: Package },
  { href: "/dashboard/categories", label: "Kategori", icon: FolderOpen },
  { href: "/dashboard/transactions", label: "Transaksi", icon: Receipt },
  { href: "/dashboard/reports", label: "Laporan", icon: BarChart3 },
  { href: "/dashboard/customers", label: "Customer", icon: UserCheck },
  { href: "/dashboard/suppliers", label: "Supplier", icon: Truck },
  { href: "/dashboard/purchase-orders", label: "Purchase Order", icon: ClipboardList },
  { href: "/dashboard/shifts", label: "Shift Kasir", icon: Clock },
  { href: "/dashboard/branches", label: "Cabang", icon: Building2, adminOnly: true },
  { href: "/dashboard/audit", label: "Audit Log", icon: ScrollText, adminOnly: true },
  { href: "/dashboard/users", label: "Pengguna", icon: Users, adminOnly: true },
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdmin = (session?.user as { role?: string })?.role === "ADMIN"

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

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

        <nav className="p-4 space-y-1 flex-1">
          {filteredNavItems.map((item) => {
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
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="px-4 py-2 mb-2">
            <p className="text-sm font-medium text-gray-800">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {isAdmin ? "Admin" : "Kasir"}
            </span>
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
        <header className="bg-white shadow-sm px-3 sm:px-6 py-3 sm:py-4 flex items-center lg:justify-end">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="text-xs sm:text-sm text-gray-600 truncate">
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
