// Input sanitization and validation utilities

/**
 * Sanitize string input - removes HTML tags and trims whitespace
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[<>]/g, "")     // Strip angle brackets
    .trim()
    .slice(0, 500)            // Max length protection
}

/**
 * Validate and parse a numeric value
 */
export function sanitizeNumber(input: unknown, min = 0, max = 999999999): number {
  const num = parseFloat(String(input))
  if (isNaN(num)) return 0
  return Math.max(min, Math.min(max, num))
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

/**
 * Validate that a string is a valid cuid() ID
 */
export function isValidId(id: unknown): boolean {
  return typeof id === "string" && /^c[a-z0-9]{24}$/.test(id)
}

/**
 * Sanitize object - recursively clean all string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value)
    } else if (typeof value === "number") {
      result[key] = sanitizeNumber(value)
    } else if (typeof value === "boolean") {
      result[key] = value
    } else if (Array.isArray(value)) {
      result[key] = value.slice(0, 100).map((item) =>
        typeof item === "object" && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : sanitizeString(item)
      )
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    }
  }
  return result as T
}
