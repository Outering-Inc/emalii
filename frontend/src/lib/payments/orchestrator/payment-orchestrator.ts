import OrderModel from '@/src/lib/db/models/orderModel'
import { deductInventoryAfterPayment } from '@/src/lib/actions/orderActions'
import { sendPurchaseReceipt } from '@/src/emails'

import { reconcileOrderPayment } from './reconciliation-orchestrator'
import { PaymentMethod, PaymentResult } from '../reconciliation/type'
import { acquirePaymentLock } from '../idempotency/acquirePaymentLock'
import { PaymentState } from '../state-machine/paymentState'

interface FinalizePaymentArgs {
  orderId: string
  paymentMethod: PaymentMethod
  paymentData: PaymentResult
}

/**
 * 🔐 FINAL PAYMENT ORCHESTRATOR
 * --------------------------------
 * This function is SAFE to call from:
 * - Webhooks
 * - Background workers
 * - Reconciliation cron
 *
 * It is:
 * - Idempotent
 * - Atomic
 * - Retry-safe
 * - Amazon-style production logic
 */
export async function finalizePayment({
  orderId,
  paymentMethod,
  paymentData,
}: FinalizePaymentArgs) {
  console.log(`[Payment] Finalizing order ${orderId}`)

  /* =====================================================
   * STEP 0: Extract provider reference (MANDATORY)
   * ===================================================== */
  const providerReference =
    paymentData.id ?? paymentData.raw?.providerReference

  if (!providerReference) {
    throw new Error('Missing provider reference for idempotency')
  }

  /* =====================================================
   * STEP 1: GLOBAL IDEMPOTENCY LOCK (Redis)
   * ===================================================== */
  const lockAcquired = await acquirePaymentLock(orderId, providerReference)

  if (!lockAcquired) {
    console.log(`[Payment] Duplicate finalize attempt ignored`)
    return { alreadyProcessed: true }
  }

  /* =====================================================
   * STEP 2: FETCH FRESH ORDER (SOURCE OF TRUTH)
   * ===================================================== */
  const order = await OrderModel.findById(orderId).populate('user', 'email')
  if (!order) throw new Error('Order not found')

  /* =====================================================
   * STEP 3: BUSINESS IDEMPOTENCY
   * ===================================================== */
  if (order.isPaid || order.paymentState === PaymentState.CAPTURED) {
    console.log(`[Payment] Order already finalized`)
    return { alreadyPaid: true }
  }

  /* =====================================================
   * STEP 4: RECONCILE PAYMENT (CRITICAL)
   * ===================================================== */
  const reconciliation = await reconcileOrderPayment(
    paymentMethod,
    paymentData,
    Number(order.totalPrice)
  )

  if (reconciliation.status !== 'MATCHED') {
    throw new Error(
      `Payment verification failed: ${reconciliation.failureReason}`
    )
  }

  /* =====================================================
   * STEP 5: ATOMIC ORDER FINALIZATION
   * ===================================================== */
  const updatedOrder = await OrderModel.findOneAndUpdate(
    {
      _id: orderId,
      isPaid: false,
      paymentState: { $ne: PaymentState.CAPTURED },
    },
    {
      $set: {
        isPaid: true,
        paidAt: new Date(),
        paymentState: PaymentState.CAPTURED,
        paymentMethod,
        paymentResult: {
          id: reconciliation.providerReference ?? '',
          status: 'COMPLETED',
          pricePaid: reconciliation.paidAmount ?? 0,
          email_address: order.user?.email ?? '',
        },
      },
    },
    { new: true }
  )

  if (!updatedOrder) {
    console.log(`[Payment] Order already finalized by another worker`)
    return { alreadyProcessed: true }
  }

  console.log(
    `[Payment] Order ${orderId} finalized (CAPTURED) — amount: ${reconciliation.paidAmount}`
  )

  /* =====================================================
   * STEP 6: POST-PAYMENT SIDE EFFECTS (ASYNC & SAFE)
   * ===================================================== */
  await Promise.allSettled([
    deductInventoryAfterPayment(orderId).catch(err =>
      console.error(`[Inventory] Failed`, err)
    ),
    sendPurchaseReceipt({ order: updatedOrder }).catch(err =>
      console.error(`[Email] Failed`, err)
    ),
  ])

  /* =====================================================
   * STEP 7: RETURN CANONICAL RESULT
   * ===================================================== */
  return {
    success: true,
    orderId,
    paidAmount: reconciliation.paidAmount,
    providerReference: reconciliation.providerReference,
  }
}
