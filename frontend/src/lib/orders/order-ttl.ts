// src/lib/orders/order-ttl.ts

const RETRY_TTL_MINUTES = 15 // Amazon-like window

export function isRetryExpired(createdAt: Date) {
  const expiresAt =
    createdAt.getTime() + RETRY_TTL_MINUTES * 60 * 1000

  return Date.now() > expiresAt
}

export function retryExpiresAt(createdAt: Date) {
  return new Date(
    createdAt.getTime() + RETRY_TTL_MINUTES * 60 * 1000
  )
}
