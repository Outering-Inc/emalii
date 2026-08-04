// src/lib/orders/order-status.ts

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'AUTHORIZED'
  | 'SUCCESS'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'ERROR'

/**
 * Terminal states (no more state transitions)
 */
export const TERMINAL_STATUSES: OrderStatus[] = [
  'SUCCESS',
  'FAILED',
  'EXPIRED',
  'CANCELLED',
]

/**
 * Payment retry is allowed only for these states
 * (Amazon/Jumia rule)
 */
export const RETRYABLE_STATUSES: OrderStatus[] = [
  'FAILED',
  'EXPIRED',
  'ERROR',
]

/**
 * Domain helpers
 */
export function isTerminalStatus(status: OrderStatus) {
  return TERMINAL_STATUSES.includes(status)
}

export function canRetryPayment(status: OrderStatus) {
  return RETRYABLE_STATUSES.includes(status)
}

export function isSuccessful(status: OrderStatus) {
  return status === 'SUCCESS'
}

export function isFailed(status: OrderStatus) {
  return status === 'FAILED'
}