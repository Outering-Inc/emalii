import {
  ReconciliationResult,
  ReconciliationStatus,
} from './type'
import {
  verifyPayPalPayment,
  PayPalCaptureResponse,
} from '../paypal/verify-payment'
import { toMinorUnits } from '../../utils/utils'

interface PayPalReconciliationInput {
  providerReference: string
  expectedAmount: number
  expectedCurrency: string
  expectedReceiverEmail?: string
}



export async function paypalReconciliation(
  input: PayPalReconciliationInput
): Promise<ReconciliationResult> {
  try {
    const {
      providerReference,
      expectedAmount,
      expectedCurrency,
      expectedReceiverEmail,
    } = input

    /* ===============================
       1️⃣ Fetch Capture
    =============================== */
    const capture: PayPalCaptureResponse =
      await verifyPayPalPayment(providerReference)

    const paidAmountMinor = toMinorUnits(capture.amount.value)
    const currency = capture.amount.currency_code.toUpperCase()

    /* ===============================
       2️⃣ Validate status
    =============================== */
    if (capture.status !== 'COMPLETED') {
      return failure('Capture not completed', capture, expectedAmount)
    }

    /* ===============================
       3️⃣ Validate final capture
    =============================== */
    if (!capture.final_capture) {
      return failure('Not a final capture', capture, expectedAmount)
    }

    /* ===============================
       4️⃣ Validate currency
    =============================== */
    if (currency !== expectedCurrency.toUpperCase()) {
      return mismatch('Currency mismatch', capture, expectedAmount)
    }

    /* ===============================
       5️⃣ Validate amount
    =============================== */
    if (paidAmountMinor !== expectedAmount) {
      return mismatch('Amount mismatch', capture, expectedAmount)
    }

    /* ===============================
       6️⃣ Validate receiver email
    =============================== */
    if (
      expectedReceiverEmail &&
      capture.payee?.email_address &&
      capture.payee.email_address !== expectedReceiverEmail
    ) {
      return failure('Receiver email mismatch', capture, expectedAmount)
    }

    /* ===============================
       7️⃣ Refund detection
    =============================== */
    const refunded =
      capture.seller_receivable_breakdown?.total_refunded_amount?.value

    if (refunded && toMinorUnits(refunded) > 0) {
      return failure('Payment was refunded', capture, expectedAmount)
    }

    /* ===============================
       8️⃣ Log PayPal fees
    =============================== */
    const fee =
      capture.seller_receivable_breakdown?.paypal_fee?.value

    console.log('PayPal Fee:', fee)
    console.log('Capture ID:', capture.id)

    /* ===============================
       9️⃣ Duplicate protection (DB)
    =============================== */
    // const exists = await paymentRepo.exists(providerReference)
    // if (exists) {
    //   return failure('Duplicate capture detected', capture, expectedAmount)
    // }

    /* ===============================
       ✅ Success
    =============================== */
    return {
      status: ReconciliationStatus.MATCHED,
      providerStatus: capture.status,
      providerReference: capture.id,
      paidAmount: paidAmountMinor,
      expectedAmount,
      raw: capture,
      reconciledAt: new Date(),
    }
  } catch (error) {
    return {
      status: ReconciliationStatus.FAILED,
      providerStatus: 'ERROR',
      providerReference: input.providerReference,
      paidAmount: 0,
      expectedAmount: input.expectedAmount,
      failureReason:
        error instanceof Error ? error.message : 'Unknown error',
      raw: null,
      reconciledAt: new Date(),
    }
  }
}

/* ===============================
   Helpers
================================= */

function failure(
  reason: string,
  capture: PayPalCaptureResponse,
  expectedAmount: number
): ReconciliationResult {
  return {
    status: ReconciliationStatus.FAILED,
    providerStatus: capture.status,
    providerReference: capture.id,
    paidAmount: toMinorUnits(capture.amount.value),
    expectedAmount,
    failureReason: reason,
    raw: capture,
    reconciledAt: new Date(),
  }
}

function mismatch(
  reason: string,
  capture: PayPalCaptureResponse,
  expectedAmount: number
): ReconciliationResult {
  return {
    status: ReconciliationStatus.MISMATCH,
    providerStatus: capture.status,
    providerReference: capture.id,
    paidAmount: toMinorUnits(capture.amount.value),
    expectedAmount,
    failureReason: reason,
    raw: capture,
    reconciledAt: new Date(),
  }
}
