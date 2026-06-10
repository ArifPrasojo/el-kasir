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
