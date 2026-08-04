import Stripe from 'stripe'
import { stripe, verifyStripePayment } from '../stripe/payment-verification'
import { ReconciliationResult, ReconciliationStatus } from './type'

interface StripeReconciliationInput {
  providerReference: string          // paymentIntentId
  expectedAmount: number             // minor units
  expectedCurrency: string
  expectedOrderId: string
  expectedCustomerId?: string
  environment: 'live' | 'test'
}

export async function stripeReconciliation(
  input: StripeReconciliationInput
): Promise<ReconciliationResult> {
  try {
    const {
      providerReference,
      expectedAmount,
      expectedCurrency,
      expectedOrderId,
      expectedCustomerId,
      environment,
    } = input

    /* ===============================
       1️⃣ Fetch PaymentIntent
    =============================== */
    const paymentIntent = await verifyStripePayment(providerReference)

    /* ===============================
       2️⃣ Validate environment (livemode)
    =============================== */
    const shouldBeLive = environment === 'live'

    if (paymentIntent.livemode !== shouldBeLive) {
      return failure(
        'Environment mismatch (livemode validation failed)',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       3️⃣ Validate status
    =============================== */
    if (paymentIntent.status !== 'succeeded') {
      return failure(
        'PaymentIntent not succeeded',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       4️⃣ Validate amount
    =============================== */
    if (paymentIntent.amount_received !== expectedAmount) {
      return mismatch(
        'Amount mismatch',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       5️⃣ Validate currency
    =============================== */
    if (
      paymentIntent.currency.toUpperCase() !==
      expectedCurrency.toUpperCase()
    ) {
      return mismatch(
        'Currency mismatch',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       6️⃣ Validate metadata.orderId
    =============================== */
    if (paymentIntent.metadata?.orderId !== expectedOrderId) {
      return failure(
        'Order ID metadata mismatch',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       7️⃣ Validate customer
    =============================== */
    if (
      expectedCustomerId &&
      paymentIntent.customer !== expectedCustomerId
    ) {
      return failure(
        'Customer mismatch',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       8️⃣ Validate latest charge
    =============================== */
    let charge: Stripe.Charge | null = null

    if (paymentIntent.latest_charge) {
      charge =
        typeof paymentIntent.latest_charge === 'string'
          ? await stripe.charges.retrieve(paymentIntent.latest_charge)
          : paymentIntent.latest_charge
    }

    if (!charge) {
      return failure(
        'Missing charge data',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       9️⃣ Refund detection
    =============================== */
    if (charge.amount_refunded > 0) {
      return failure(
        'Payment was refunded',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       🔟 Dispute detection
    =============================== */
    if (charge.disputed) {
      return failure(
        'Payment is disputed',
        paymentIntent,
        expectedAmount
      )
    }

    /* ===============================
       1️⃣1️⃣ Log balance transaction
    =============================== */
    const balanceTransaction =
      typeof charge.balance_transaction === 'string'
        ? await stripe.balanceTransactions.retrieve(
            charge.balance_transaction
          )
        : charge.balance_transaction

    // 🔎 You can log this to your ledger
    console.log('Balance Transaction ID:', balanceTransaction?.id)
    console.log('Stripe Fee:', balanceTransaction?.fee)

    /* ===============================
       1️⃣2️⃣ Duplicate PaymentIntent reuse protection
    =============================== */
    // 🔒 IMPORTANT:
    // You must check your DB to ensure this paymentIntentId
    // has not already been marked as reconciled.
    //
    // Example:
    // const alreadyProcessed = await paymentRepo.exists(providerReference)
    // if (alreadyProcessed) { return failure('Duplicate PaymentIntent reuse detected') }

    /* ===============================
       ✅ All checks passed
    =============================== */
    return {
      status: ReconciliationStatus.MATCHED,
      providerStatus: paymentIntent.status,
      providerReference: paymentIntent.id,
      paidAmount: paymentIntent.amount_received,
      expectedAmount,
      raw: paymentIntent,
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
   Helper functions
================================= */

function failure(
  reason: string,
  paymentIntent: Stripe.PaymentIntent,
  expectedAmount: number
): ReconciliationResult {
  return {
    status: ReconciliationStatus.FAILED,
    providerStatus: paymentIntent.status,
    providerReference: paymentIntent.id,
    paidAmount: paymentIntent.amount_received,
    expectedAmount,
    failureReason: reason,
    raw: paymentIntent,
    reconciledAt: new Date(),
  }
}

function mismatch(
  reason: string,
  paymentIntent: Stripe.PaymentIntent,
  expectedAmount: number
): ReconciliationResult {
  return {
    status: ReconciliationStatus.MISMATCH,
    providerStatus: paymentIntent.status,
    providerReference: paymentIntent.id,
    paidAmount: paymentIntent.amount_received,
    expectedAmount,
    failureReason: reason,
    raw: paymentIntent,
    reconciledAt: new Date(),
  }
}
