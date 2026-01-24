/* eslint-disable @typescript-eslint/no-explicit-any */
import OrderModel from '@/src/lib/db/models/orderModel'
import { deductInventoryAfterPayment } from '@/src/lib/actions/orderActions'
import { sendPurchaseReceipt } from '@/src/emails'
import { verifyMpesaPayment } from '../mpesa/payment-verification'
import { verifyPayPalPayment } from '../paypal/payment-verification'
import { verifyStripePayment } from '../stripe/payment-verification'

// ---------------------
// Payment Method Enum
// ---------------------
export enum PaymentMethod {
  Mpesa = 'Mpesa',
  PayPal = 'PayPal',
  Stripe = 'Stripe',
  CashOnDelivery = 'Cash On Delivery',
}

// ---------------------
// Type guard for email
// ---------------------
interface PopulatedUser {
  email: string
}

function hasEmail(user: unknown): user is PopulatedUser {
  return typeof user === 'object' && user !== null && 'email' in user
}

// ---------------------
// Finalize Payment
// ---------------------
export async function finalizePayment({
  orderId,
  paymentMethod,
  paymentData,
}: {
  orderId: string
  paymentMethod: PaymentMethod | string
  paymentData: any
}) {
  console.log(`[Payment Orchestrator] Finalizing payment for order ${orderId} using ${paymentMethod}`)

  // 1️⃣ Load order from DB
  const order = await OrderModel.findById(orderId).populate('user', 'email')
  if (!order) throw new Error('Order not found')

  // 2️⃣ Idempotency guard
  if (order.isPaid) {
    console.log(`[Payment Orchestrator] Order ${orderId} already marked as paid`)
    return { alreadyPaid: true }
  }

  let verified = false
  let paidAmount = Number(order.totalPrice)

  // 3️⃣ Verify payment based on provider
  switch (paymentMethod) {
    case PaymentMethod.Mpesa:
      verified = await verifyMpesaPayment(paymentData)
      paidAmount = Number(paymentData.amount)
      if (paidAmount !== Number(order.totalPrice)) {
        throw new Error(
          `Mpesa payment amount mismatch. Expected ${order.totalPrice}, got ${paidAmount}`
        )
      }
      break

    case PaymentMethod.PayPal:
      verified = await verifyPayPalPayment(paymentData)
      paidAmount = Number(
        paymentData.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value
      )
      break

    case PaymentMethod.Stripe:
      verified = await verifyStripePayment(paymentData)
      paidAmount = Number(paymentData.amountReceived / 100)
      break

    case PaymentMethod.CashOnDelivery:
      verified = true
      break

    default:
      throw new Error(`Unsupported payment method: ${paymentMethod}`)
  }

  // 4️⃣ Fail fast if verification fails
  if (!verified) throw new Error('Payment verification failed')

  const email = hasEmail(order.user) ? order.user.email : ''

  // 5️⃣ Mark order as paid
  order.isPaid = true
  order.paidAt = new Date()
  order.paymentMethod = paymentMethod
  order.paymentResult = {
    id:
      paymentData.orderID ||
      paymentData.checkoutRequestID ||
      paymentData.paymentIntentId,
    status: 'COMPLETED',
    email_address: email,
    pricePaid: paidAmount,
  }

  await order.save()
  console.log(`[Payment Orchestrator] Order ${orderId} marked as paid`)

  // 6️⃣ Post-payment actions in parallel with logging
  await Promise.allSettled([
    deductInventoryAfterPayment(orderId).catch((err) =>
      console.error(`[Payment Orchestrator] Inventory deduction failed for order ${orderId}:`, err)
    ),
    sendPurchaseReceipt({ order }).catch((err) =>
      console.error(`[Payment Orchestrator] Sending receipt failed for order ${orderId}:`, err)
    ),
  ])

  console.log(`[Payment Orchestrator] Post-payment tasks completed for order ${orderId}`)

  return { success: true, paidAmount }
}
