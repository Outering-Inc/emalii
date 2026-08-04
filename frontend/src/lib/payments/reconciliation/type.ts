/* eslint-disable @typescript-eslint/no-explicit-any */

// ---------------------
// Payment methods enum
// ---------------------
export enum PaymentMethod {
  Mpesa = 'Mpesa',
  PayPal = 'PayPal',
  Stripe = 'Stripe',
  CashOnDelivery = 'Cash On Delivery',
}

// ---------------------
// PaymentResult
// ---------------------
export interface PaymentResult {
  id?: string
  amount?: number
  currency?: string
  email_address?: string
  paymentIntentId?: string
  checkoutRequestID?: string
  orderID?: string
  raw?: any // optional
  status?: string
  pricePaid?: number
}


// ---------------------
// Reconciliation statuses
// ---------------------
export enum ReconciliationStatus {
  MATCHED = 'MATCHED',
  MISMATCH = 'MISMATCH',
  FAILED = 'FAILED',
}

// ---------------------
// ReconciliationResult (Amazon-style normalized output)
// ---------------------
export interface ReconciliationResult {
  /** Final reconciliation outcome */
  status: ReconciliationStatus

  /** Provider transaction reference (PayPal captureId, Mpesa receipt, Stripe intent) */
  providerReference?: string

  /** Raw provider status (COMPLETED, APPROVED, SUCCESS, etc.) */
  providerStatus?: string

  /** Amount paid according to provider */
  paidAmount?: number

  /** Expected order amount */
  expectedAmount?: number

  /** Human-readable failure reason */
  failureReason?: string

  /** Raw provider payload for audit/debug */
  raw?: any

  /** Timestamp */
  reconciledAt?: Date
}


