/* eslint-disable @typescript-eslint/no-explicit-any */
import OrderModel from '@/src/lib/db/models/orderModel'
import { deductInventoryAfterPayment } from '@/src/lib/actions/orderActions'
import { sendPurchaseReceipt } from '@/src/emails'
import { verifyMpesaPayment } from '../mpesa/payment-verification'
import { verifyPayPalPayment } from '../paypal/payment-verification'
import { verifyStripePayment } from '../stripe/payment-verification'

// Type guard to check if user has email
interface PopulatedUser {
  email: string
}

function hasEmail(user: unknown): user is PopulatedUser {
  return typeof user === 'object' && user !== null && 'email' in user
}

export async function finalizePayment({
  orderId,
  paymentMethod,
  paymentData,
}: {
  orderId: string
  paymentMethod: string
  paymentData: any
}) {
  //1️⃣ Load Order from DB
  const order = await OrderModel.findById(orderId).populate('user', 'email')
  if (!order) throw new Error('Order not found')
  
  //2️⃣ Idempotency Guard 
  if (order.isPaid) return { alreadyPaid: true }

  let verified = false
  let paidAmount = Number(order.totalPrice)

  //3️⃣ Verify Payment by Provider
  switch (paymentMethod) {
    case 'Mpesa':
      verified = await verifyMpesaPayment(paymentData)
      paidAmount = paymentData.amount
      break

    case 'PayPal':
      verified = await verifyPayPalPayment(paymentData)
      paidAmount = Number(
        paymentData.purchaseUnits?.[0]?.payments?.captures?.[0]?.amount?.value
      )
      break

    case 'Stripe':
      verified = await verifyStripePayment(paymentData)
      paidAmount = paymentData.amountReceived / 100
      break

    case 'Cash On Delivery':
      verified = true
      break
  }

  //4️⃣ Fail Fast on Verification Failure
  if (!verified) throw new Error('Payment verification failed')

  const email = hasEmail(order.user) ? order.user.email : ''

  //5️⃣ Mark Order as Paid
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
  //6️⃣ Post-Payment Actions
  await deductInventoryAfterPayment(orderId)
  await sendPurchaseReceipt({ order })

  return { success: true }
}
