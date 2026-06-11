import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

/**
 * Safe redirect helper — menghindari "Invalid URL" di Turbopack dev mode
 * yang bisa mengirim request.url sebagai path relatif.
 */
function redirect(request: NextRequest, path: string) {
  const url = request.nextUrl.clone()
  url.pathname = path
  url.search = ""
  return NextResponse.redirect(url)
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  // Login & auth routes — selalu lolos
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    // Sudah login → redirect ke dashboard
    if (token && pathname.startsWith("/login")) {
      return redirect(request, "/dashboard")
    }
    return NextResponse.next()
  }

  // Belum login → redirect ke login
  if (!token) {
    return redirect(request, "/login")
  }

  // Fitur shift dihapus → redirect ke dashboard
  if (pathname.startsWith("/dashboard/shifts")) {
    return redirect(request, "/dashboard")
  }

  // Halaman khusus admin
  const adminOnlyPaths = [
    "/dashboard/users",
    "/dashboard/branches",
    "/dashboard/audit",
  ]
  if (adminOnlyPaths.some((p) => pathname.startsWith(p)) && token.role !== "ADMIN") {
    return redirect(request, "/dashboard")
  }

  // Halaman yang kasir tidak boleh akses
  const cashierRestrictedPaths = [
    "/dashboard/products",
    "/dashboard/categories",
    "/dashboard/suppliers",
    "/dashboard/raw-materials",
    "/dashboard/purchase-orders",
  ]
  if (
    cashierRestrictedPaths.some((p) => pathname.startsWith(p)) &&
    token.role !== "ADMIN"
  ) {
    return redirect(request, "/dashboard")
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)", "/login"],
}
