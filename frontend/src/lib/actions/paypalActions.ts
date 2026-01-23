'use server'

import { connectToDatabase } from "../db/dbConnect"
import Order from "../db/models/orderModel"
import { revalidatePath } from "next/cache"
import { formatError } from "../utils/utils"
import { cache } from "react"
import { paypal } from "../payments/paypal/paypal"
import { finalizePayment } from "../payments/orchestrator/payment-orchestrator"

// Create PayPal Order
export const createPayPalOrder = cache(async (orderId: string) => {
  await connectToDatabase()
  try {
    const order = await Order.findById(orderId)
    if (!order) throw new Error('Order not found')

    const paypalOrder = await paypal.createOrder(order.totalPrice)

    order.paymentResult = {
      id: paypalOrder.id,
      email_address: '',
      status: '',
      pricePaid: 0,
    }
    await order.save()

    return {
      success: true,
      message: 'PayPal order created successfully',
      data: paypalOrder.id,
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
})

// Approve PayPal Order -- Finalize Payment
export const approvePayPalOrder = cache(
  async (orderId: string, data: { orderID: string }) => {
    await connectToDatabase()

    try {
      const order = await Order.findById(orderId)
      if (!order) throw new Error('Order not found')

      // 1️⃣ Capture payment from PayPal
      const captureData = await paypal.capturePayment(data.orderID)

      if (
        captureData.status !== 'COMPLETED' ||
        captureData.id !== order.paymentResult?.id
      ) {
        throw new Error('Invalid PayPal capture')
      }

      // 2️⃣ Delegate EVERYTHING to orchestrator
      await finalizePayment({
        orderId,
        paymentMethod: 'PayPal',
        paymentData: captureData,
      })

      // 3️⃣ UI refresh only
      revalidatePath(`/account/orders/${orderId}`)

      return {
        success: true,
        message: 'PayPal payment completed successfully',
      }
    } catch (err) {
      return { success: false, message: formatError(err) }
    }
  }
)

