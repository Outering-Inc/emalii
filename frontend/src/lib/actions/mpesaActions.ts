'use server'

import { cache } from 'react'
import { connectToDatabase } from '../db/dbConnect'
import OrderModel from '../db/models/orderModel'
import MpesaTransaction from '../db/models/mpesaModel'
import MpesaCheckoutMapping from '../db/models/mpesaCheckout.model'
import { mpesa } from '../payments/mpesa/safaricom'
import { formatError } from '../utils/utils'


export const createMpesaOrder = cache(async (orderId: string) => {
  await connectToDatabase()

  try {
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')

    const phone = order.shippingAddress.phone

    const existingTx = await MpesaTransaction.findOne({
      phone,
      status: 'PENDING',
    })
    if (existingTx) {
      throw new Error('A transaction is already in progress for this number.')
    }

    const amount = Math.ceil(order.totalPrice)
    const response = await mpesa.initiateStkPush(amount, phone)

    if (response?.CheckoutRequestID) {
      await MpesaCheckoutMapping.create({
        orderId: order._id.toString(),
        userId: order.user.toString(),
        checkoutRequestId: response.CheckoutRequestID,
      })
    }

    return {
      success: true,
      message: 'Mpesa STK push initiated successfully',
      data: response,
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
})
