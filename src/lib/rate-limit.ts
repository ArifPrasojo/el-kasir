// Simple in-memory rate limiter for API protection
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  key: string,
  { maxRequests, windowMs }: { maxRequests: number; windowMs: number }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Clean up expired records periodically
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (v.resetTime < now) rateLimitMap.delete(k)
    }
  }

  if (!record || record.resetTime < now) {
    const resetTime = now + windowMs
    rateLimitMap.set(key, { count: 1, resetTime })
    return { success: true, remaining: maxRequests - 1, resetTime }
  }

  record.count++
  const remaining = Math.max(0, maxRequests - record.count)
  return {
    success: record.count <= maxRequests,
    remaining,
    resetTime: record.resetTime,
  }
}

// Get client IP from request
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  const realIP = request.headers.get("x-real-ip")
  if (realIP) return realIP
  return "unknown"
}
