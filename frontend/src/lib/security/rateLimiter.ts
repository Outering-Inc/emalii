import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '1 m'), // 3 retries per minute
})

export async function rateLimit(key: string) {
  const { success, reset } = await limiter.limit(key)
  return { allowed: success, retryAfter: reset ? Math.ceil((reset - Date.now()) / 1000) : null }
}
