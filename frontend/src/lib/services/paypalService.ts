 'use server'
 
import dbConnect from "../db/dbConnect"
import Order from "../db/models/orderModel"
import { sendPurchaseReceipt } from "@/src/emails"
import { paypal } from "../payments/paypal/paypal"
import { revalidatePath } from "next/cache"
import { formatError } from "../utils/utils"
import { cache } from "react"

// Create PayPal Order
const createPayPalOrder = cache(async (orderId: string) => {
    await dbConnect()
    try {
      const order = await Order.findById(orderId)
      if (order) {
        const paypalOrder = await paypal.createOrder(order.totalPrice)
        order.paymentResult = {
          id: paypalOrder.id,
          email_address: '',
          status: '',
          pricePaid: '0',
        }
        await order.save()
        return {
          success: true,
          message: 'PayPal order created successfully',
          data: paypalOrder.id,
        }
      } else {
        throw new Error('Order not found')
      }
    } catch (err) {
      return { success: false, message: formatError(err) }
    }
  })
  
  // ApprovePayPalOrder
  const approvePayPalOrder = cache(async(
    orderId: string,
    data: { orderID: string } //data inside paypal
  )  => {
    await dbConnect()
    try {
      const order = await Order.findById(orderId).populate('user', 'email')
      if (!order) throw new Error('Order not found')
  
      const captureData = await paypal.capturePayment(data.orderID)  //capture orderId in paypal
      if (
        !captureData ||
        captureData.id !== order.paymentResult?.id ||
        captureData.status !== 'COMPLETED'
      )
        throw new Error('Error in paypal payment')
      order.isPaid = true
      order.paidAt = new Date()
      order.paymentResult = {
        id: captureData.id,
        status: captureData.status,
        email_address: captureData.payer.email_address,
        pricePaid:
          captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      }
      await order.save()
      await sendPurchaseReceipt({ order })
      revalidatePath(`/account/orders/${orderId}`)
      return {
        success: true,
        message: 'Your order has been successfully paid by PayPal',
      }
    } catch (err) {
      return { success: false, message: formatError(err) }
    }
  })
  
  const paypalService = {
    createPayPalOrder,
    approvePayPalOrder,
}
export default paypalService