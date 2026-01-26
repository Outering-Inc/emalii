'use server'

import { connectToDatabase } from "../db/dbConnect"
import Order from "../db/models/orderModel"
import { formatError } from "../utils/utils"
import { cache } from "react"
import { paypal } from "../payments/paypal/paypal"


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


