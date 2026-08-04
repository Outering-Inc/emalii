/* eslint-disable @typescript-eslint/no-explicit-any */
import paymentJobModel from '../db/models/paymentJobModel'
import OrderModel from '@/src/lib/db/models/orderModel'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentState } from '@/src/lib/payments/state-machine/paymentState'
import { applyPaymentTransition } from '@/src/lib/payments/state-machine/applyTransition'
import { acquirePaymentLock } from '@/src/lib/payments/idempotency/acquirePaymentLock'

/**
 * Amazon-style async payment finalization worker
 */
export async function processPaymentJobs() {
  // 1️⃣ Fetch a pending job (attempts < 5)
  const job = await paymentJobModel.findOneAndUpdate(
    {
      status: 'PENDING',
      attempts: { $lt: 5 },
    },
    {
      status: 'PROCESSING',
      $inc: { attempts: 1 },
    },
    { new: true }
  )

  if (!job) return

  try {
    const order = await OrderModel.findById(job.orderId)
    if (!order) throw new Error('Order not found')

    /**
     * 🔒 Global idempotency lock
     * Prevents:
     * - webhook replays
     * - duplicate jobs
     * - parallel workers
     */
    const lock = await acquirePaymentLock(
      job.orderId.toString(),
      job.providerReference
    )

    if (!lock) {
      job.status = 'DONE'
      await job.save()
      return
    }

    /**
     * 🔁 State transition: AUTHORIZED → CAPTURE_PENDING
     */
    order.paymentState = applyPaymentTransition(
      order.paymentState,
      PaymentState.CAPTURE_PENDING
    )
    await order.save()

    /**
     * ✅ Side effects (emails, invoices, ledger, fulfillment)
     * MUST be idempotent
     */
    await finalizePayment({
      orderId: job.orderId.toString(),
      paymentMethod: job.paymentMethod,
      paymentData: job.paymentData,
    })

    /**
     * 🔁 Final Update Order transition: CAPTURE_PENDING → CAPTURED
     */
    order.paymentState = applyPaymentTransition(
      order.paymentState,
      PaymentState.CAPTURED
    )
    // 6️⃣ Mark job as DONE and update order
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()

    job.status = 'DONE'
  } catch (e: any) {
    // 7️⃣ Retry logic
    job.status = job.attempts >= 5 ? 'FAILED' : 'PENDING'
    job.lastError = e.message
  }

  await job.save()
}
