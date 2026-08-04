import { redis } from './redis'

export async function withIdempotency<T>(key: string, handler: () => Promise<T>) {
  const exists = await redis.get(key)
  if (exists) return exists as T

  const result = await handler()
  await redis.set(key, JSON.stringify(result), { ex: 60 * 60 }) // 1h
  return result
}
