/* eslint-disable @typescript-eslint/no-explicit-any */
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
    // 1️⃣ Fetch order
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')

    const phone = order.shippingAddress.phone

    // 2️⃣ Prevent duplicate pending transaction
    const existingTx = await MpesaTransaction.findOne({
      phone,
      status: 'PENDING',
    })

    if (existingTx) {
      throw new Error('A transaction is already in progress for this number.')
    }

    // 3️⃣ Initiate STK Push
    const amount = Math.ceil(order.totalPrice)
    const response = await mpesa.initiateStkPush(amount, phone)

    if (!response?.CheckoutRequestID) {
      throw new Error('Failed to initiate Mpesa STK push')
    }

    // 4️⃣ Persist checkout mapping
    await MpesaCheckoutMapping.create({
      orderId: order._id.toString(),
      userId: order.user.toString(),
      checkoutRequestId: response.CheckoutRequestID,
    })

    // 5️⃣ Create MpesaTransaction
    const transaction = await MpesaTransaction.create({
      orderId: order._id,
      user: order.user,
      phone,
      amount,
      status: 'PENDING',
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
      paymentData: response, // raw Safaricom response
    })

    // 6️⃣ Return clean data object (industry standard)
    return {
      success: true,
      message: 'Mpesa STK push initiated successfully',
      data: {
        transactionId: (transaction._id as any).toString(),
        checkoutRequestId: response.CheckoutRequestID,
        merchantRequestId: response.MerchantRequestID,
        amount,
        phone,
        status: transaction.status,
      },
    }
  } catch (err) {
    return {
      success: false,
      message: formatError(err),
    }
  }
})
