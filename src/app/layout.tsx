import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "El-Kasir - Sistem Kasir Modern",
  description: "Sistem kasir modern untuk bisnis Anda",
  icons: {
    icon: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  )
}
