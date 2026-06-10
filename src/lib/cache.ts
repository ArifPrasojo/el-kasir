import { redis } from "./redis"

// In-memory fallback when Redis is not available
const memoryCache = new Map<string, { value: string; expiry: number }>()

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    if (redis) {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    }
    // Fallback to memory cache
    const entry = memoryCache.get(key)
    if (entry && entry.expiry > Date.now()) {
      return JSON.parse(entry.value)
    }
    if (entry) memoryCache.delete(key)
    return null
  } catch {
    return null
  }
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const serialized = JSON.stringify(value)
    if (redis) {
      await redis.setex(key, ttlSeconds, serialized)
    } else {
      memoryCache.set(key, {
        value: serialized,
        expiry: Date.now() + ttlSeconds * 1000,
      })
    }
  } catch {
    // Silently fail - cache miss is not critical
  }
}

export async function cacheInvalidate(key: string): Promise<void> {
  try {
    if (redis) {
      await redis.del(key)
    } else {
      memoryCache.delete(key)
    }
  } catch {
    // Silently fail
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  try {
    if (redis) {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } else {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key)
        }
      }
    }
  } catch {
    // Silently fail
  }
}
