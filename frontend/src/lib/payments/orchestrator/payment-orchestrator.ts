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

export async function finalizePayment({
  orderId,
  paymentMethod,
  paymentData,
}: FinalizePaymentArgs) {
  console.log(`[Payment] Finalizing order ${orderId}`)

  const providerReference =
    paymentData.id ?? paymentData.raw?.providerReference

  if (!providerReference) {
    throw new Error('Missing provider reference for idempotency')
  }

  // 🔐 STEP 1: Idempotency lock (GLOBAL safety)
  const lockAcquired = await acquirePaymentLock(orderId, providerReference)

  if (!lockAcquired) {
    console.log(`[Payment] Duplicate finalize attempt ignored`)
    return { alreadyProcessed: true }
  }

  // 🔒 STEP 2: Fetch fresh order state
  const order = await OrderModel.findById(orderId).populate('user', 'email')
  if (!order) throw new Error('Order not found')

  // 🚫 STEP 3: Business idempotency (extra safety)
  if (order.isPaid) {
    console.log(`[Payment] Order already marked as paid`)
    return { alreadyPaid: true }
  }

  // ✅ STEP 4: Reconcile payment
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

  // 💾 STEP 5: Atomic order update
  order.paymentState = PaymentState.CAPTURED // 🔥 NEW: sync state
  order.isPaid = true  // Auto-sync with state
  order.paidAt = new Date()
  order.paymentMethod = paymentMethod
  order.paymentResult = {
    id: reconciliation.providerReference ?? '',
    status: 'COMPLETED',
    pricePaid: reconciliation.paidAmount ?? 0,
    email_address: order.user?.email ?? '',
    
  }

await order.save()
console.log(`[Payment] Order ${orderId} marked as PAID (CAPTURED state)`)


  await order.save()
  console.log(`[Payment] Order ${orderId} marked as PAID`)

  // 🔁 STEP 6: Post-payment side effects (SAFE to retry)
  await Promise.allSettled([
    deductInventoryAfterPayment(orderId).catch(err =>
      console.error(`[Inventory] Failed:`, err)
    ),
    sendPurchaseReceipt({ order }).catch(err =>
      console.error(`[Email] Failed:`, err)
    ),
  ])

  return {
    success: true,
    paidAmount: reconciliation.paidAmount,
  }
}
