import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"
import { rateLimit, getClientIP } from "@/lib/rate-limit"
import { NextRequest } from "next/server"

const handler = NextAuth(authOptions)

// Wrap handler with rate limiting for login attempts
async function rateLimitedHandler(req: NextRequest, ctx: unknown) {
  // Only rate limit POST (login attempts)
  if (req.method === "POST") {
    const ip = getClientIP(req)
    const result = rateLimit(`auth:${ip}`, {
      maxRequests: 5,       // Max 5 login attempts
      windowMs: 15 * 60 * 1000, // Per 15 minutes
    })

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many login attempts. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  return handler(req as never, ctx as never)
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
