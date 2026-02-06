import { PaymentState } from './paymentState'
import { PAYMENT_TRANSITIONS } from './transitions'

/**
 * Amazon-style pure state transition
 * - No side effects
 * - No DB
 * - Deterministic
 */
export function applyPaymentTransition(
  current: PaymentState,
  next: PaymentState
): PaymentState {
  const allowed = PAYMENT_TRANSITIONS[current] ?? []

  if (!allowed.includes(next)) {
    throw new Error(
      `Invalid payment transition: ${current} → ${next}`
    )
  }

  return next
}
