import Providers from "@/components/Providers"
import Sidebar from "@/components/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <Sidebar>{children}</Sidebar>
    </Providers>
  )
}
