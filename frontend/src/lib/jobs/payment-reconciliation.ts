/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/payments/jobs/payment-reconciliation.job.ts
import OrderModel from '@/src/lib/db/models/orderModel'
import { reconcileOrderPayment } from '@/src/lib/payments/orchestrator/reconciliation-orchestrator'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'

/**
 * Production-ready Payment Reconciliation Job
 * Runs through all unpaid orders and reconciles their payments.
 */
export async function runPaymentReconciliationJob() {
  console.log('[PAYMENT RECON JOB] Starting payment reconciliation...')

  // Fetch all unpaid orders except COD (Cash On Delivery)
  const orders = await OrderModel.find({
    isPaid: false,
    paymentMethod: { $ne: 'Cash On Delivery' },
  })

  console.log(`[PAYMENT RECON JOB] Found ${orders.length} unpaid orders to reconcile.`)

  for (const order of orders) {
    try {
      // Convert string from DB to PaymentMethod enum
      const paymentMethodEnum = PaymentMethod[order.paymentMethod as keyof typeof PaymentMethod]

      if (!paymentMethodEnum) {
        console.warn(`[PAYMENT RECON JOB] Unsupported payment method: ${order.paymentMethod} for order ${order._id}`)
        continue
      }

      // Guard: ensure paymentResult exists for non-COD orders
      if (!order.paymentResult) {
        console.warn(`[PAYMENT RECON JOB] Missing paymentResult for order ${order._id}`)
        continue
      }

      // Ensure proper typing for paymentResult
      const paymentResult: PaymentResult = {
        id: order.paymentResult.id ?? 'N/A',
        status: order.paymentResult.status ?? 'UNKNOWN',
        email_address: order.paymentResult.email_address ?? '',
        pricePaid: order.paymentResult.pricePaid ?? 0,
        raw: (order.paymentResult as any)?.raw ?? {}, // cast to any
      }


      // Step 1: Reconcile payment
      const reconciliation = await reconcileOrderPayment(
        paymentMethodEnum,
        paymentResult,
        Number(order.totalPrice)
      )

      if (reconciliation.status === 'MATCHED') {
        // Step 2: Finalize payment
        await finalizePayment({
          orderId: order._id.toString(),
          paymentMethod: paymentMethodEnum,
          paymentData: paymentResult,
        })
        console.log(`[PAYMENT RECON JOB] Order ${order._id} marked as paid successfully.`)
      } else {
        console.warn(
          `[PAYMENT RECON JOB] Payment reconciliation failed for order ${order._id}: ${reconciliation.failureReason}`
        )
      }
    } catch (err) {
      console.error(`[PAYMENT RECON JOB] Error processing order ${order._id}:`, err)
    }
  }

  console.log('[PAYMENT RECON JOB] Payment reconciliation completed.')
}
