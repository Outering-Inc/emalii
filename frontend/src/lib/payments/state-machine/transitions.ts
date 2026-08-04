import { PaymentState } from './paymentState'

export const PAYMENT_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
  [PaymentState.INITIATED]: [
    PaymentState.AUTHORIZED,
    PaymentState.FAILED,
  ],

  [PaymentState.AUTHORIZED]: [
    PaymentState.CAPTURE_PENDING,
    PaymentState.FAILED,
  ],

  [PaymentState.CAPTURE_PENDING]: [
    PaymentState.CAPTURED,
    PaymentState.FAILED,
  ],

  // ✅ REQUIRED FIX
  [PaymentState.PROCESSING]: [
    PaymentState.CAPTURED,
    PaymentState.FAILED,
  ],

  [PaymentState.CAPTURED]: [
    PaymentState.REFUNDED,
    PaymentState.DISPUTED,
  ],

  [PaymentState.DISPUTED]: [
    PaymentState.REFUNDED,
    PaymentState.REVERSED,
  ],

  [PaymentState.REFUNDED]: [],

  [PaymentState.REVERSED]: [],

  [PaymentState.FAILED]: [],
}
