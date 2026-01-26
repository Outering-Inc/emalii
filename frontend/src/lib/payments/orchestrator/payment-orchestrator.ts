/* eslint-disable @typescript-eslint/no-explicit-any */
import OrderModel from '@/src/lib/db/models/orderModel'
import { deductInventoryAfterPayment } from '@/src/lib/actions/orderActions'
import { sendPurchaseReceipt } from '@/src/emails'

import { reconcileOrderPayment } from './reconciliation-orchestrator'
import { PaymentMethod } from '../reconciliation/type'


interface FinalizePaymentArgs {
  orderId: string
  paymentMethod: PaymentMethod
  paymentData: any
}

export async function finalizePayment({ orderId, paymentMethod, paymentData }: FinalizePaymentArgs) {
  console.log(`[Payment Orchestrator] Finalizing payment for order ${orderId} using ${paymentMethod}`)

  const order = await OrderModel.findById(orderId).populate('user', 'email')
  if (!order) throw new Error('Order not found')

  if (order.isPaid) {
    console.log(`[Payment Orchestrator] Order ${orderId} already paid`)
    return { alreadyPaid: true }
  }

  // ✅ Step 1: Reconciliation orchestrator
  const reconciliation = await reconcileOrderPayment(paymentMethod, paymentData, Number(order.totalPrice))

  if (reconciliation.status !== 'MATCHED') {
    throw new Error(`Payment verification failed: ${reconciliation.failureReason}`)
  }

  // ✅ Step 2: Mark order as paid
  order.isPaid = true
  order.paidAt = new Date()
  order.paymentMethod = paymentMethod
  order.paymentResult = {
    id: reconciliation.providerReference ?? '',
    status: 'COMPLETED',
    pricePaid: reconciliation.paidAmount ?? 0,
    email_address: order.user?.email ?? '',
  }

  await order.save()
  console.log(`[Payment Orchestrator] Order ${orderId} marked as paid`)

  // ✅ Step 3: Post-payment tasks
  await Promise.allSettled([
    deductInventoryAfterPayment(orderId).catch(err =>
      console.error(`[Payment Orchestrator] Inventory deduction failed:`, err)
    ),
    sendPurchaseReceipt({ order }).catch(err =>
      console.error(`[Payment Orchestrator] Sending receipt failed:`, err)
    ),
  ])

  return { success: true, paidAmount: reconciliation.paidAmount }
}
