import { LRUCache } from "lru-cache"
import type { NextRequest } from "next/server"

const cache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 10000,
  ttl: 60_000 * 10, // keep recent buckets up to 10 minutes
})

function getIp(req: NextRequest) {
  const fwd = req.headers.get("x-forwarded-for")
  if (fwd) return fwd.split(",")[0].trim()
  const realIp = req.headers.get("x-real-ip")
  if (realIp) return realIp
  // best-effort default
  return "127.0.0.1"
}

export function checkRate(req: NextRequest, route: string, limit: number, windowMs: number) {
  const ip = getIp(req)
  const now = Date.now()
  const key = `${route}:${ip}`
  const entry = cache.get(key)
  if (!entry || now > entry.resetAt) {
    cache.set(key, { count: 1, resetAt: now + windowMs }, { ttl: windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count += 1
  cache.set(key, entry, { ttl: entry.resetAt - now })
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}
