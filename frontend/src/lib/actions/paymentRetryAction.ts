'use server'

import OrderModel from '../db/models/orderModel'
import { PaymentState } from '../payments/state-machine/paymentState'
import { createMpesaOrder } from './mpesaActions'
import { createPayPalOrder } from './paypalActions'
import { createStripePayment } from './stripeActions'


/**
 * 🔒 Single retry contract (Amazon/Jumia style)
 */
export type RetryPaymentResult =
  | {
      success: true
      provider: 'MPESA' | 'STRIPE' | 'PAYPAL' | 'CASH'
      redirectUrl: string | null
      amountInCents?: number
    }
  | {
      success: false
      message: string
    }

export async function retryOrderPayment(
  orderId: string
): Promise<RetryPaymentResult> {
  /* ================= FETCH & VALIDATE ================= */
  const order = await OrderModel.findById(orderId)

  if (!order) {
    return { success: false, message: 'Order not found' }
  }

   /* ================= HARD STOPS ================= */
  if (order.isPaid) {
    return { success: false, message: 'Order already paid' }
  }

   /* ================= CASH ON DELIVERY ================= */
  if (order.paymentMethod === 'CASH') {
    order.paymentState = PaymentState.AUTHORIZED
    await order.save()

    return {
      success: true,
      provider: 'CASH',
      redirectUrl: null,
    }
  }

  /* ================= RESET PAYMENT ATTEMPT ================= */
  order.paymentState = PaymentState.INITIATED
  order.paymentReference = undefined
  order.paidAt = undefined
  await order.save()

  switch (order.paymentMethod) {
    case 'MPESA': {
      const res = await createMpesaOrder(order._id.toString())
      if (!res.success) return { success: false, message: res.message }
      // ✅ MPESA never redirects externally
      return {
        success: true,
        provider: 'MPESA',
        redirectUrl: `/checkout/${order._id}/processing`,
      }
    }

    case 'STRIPE': {
      const res = await createStripePayment(order._id.toString())
      if (!res.success || !res.data?.clientSecret)
        return { success: false, message: res.message }

      return {
        success: true,
        provider: 'STRIPE',
        redirectUrl: `/checkout/${order._id}/processing`,
        amountInCents: order.totalPrice * 100, //✅ canonical source
      }
    }

    case 'PAYPAL': {
      const res = await createPayPalOrder(order._id.toString())
      if (!res.success || !res.data)
        return { success: false, message: res.message }

      return {
        success: true,
        provider: 'PAYPAL',
        redirectUrl: res.data,
      }
    }

    default:
      return { success: false, message: 'Unsupported payment method' }
  }
}
