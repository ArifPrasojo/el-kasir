import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined
}

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn("REDIS_URL not set - caching disabled, using in-memory fallback")
    return null
  }
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis
