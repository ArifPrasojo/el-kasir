/**
 * Safely parse URLSearchParams from a NextRequest.
 * Works with both absolute URLs and relative paths (Turbopack dev mode).
 */
export function getSearchParams(url: string): URLSearchParams {
  try {
    return new URL(url).searchParams
  } catch {
    // Turbopack may pass a relative path like "/api/products?search=x"
    const qIndex = url.indexOf("?")
    if (qIndex !== -1) {
      return new URLSearchParams(url.slice(qIndex + 1))
    }
    return new URLSearchParams()
  }
}

/**
 * Safe fetch wrapper that handles errors gracefully
 */
export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const res = await fetch(url, options)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
      throw new Error(errorData.error || `Request failed: ${res.status}`)
    }
    const text = await res.text()
    if (!text) return [] as T
    return JSON.parse(text) as T
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`API parse error for ${url}:`, error)
      return [] as T
    }
    throw error
  }
}
