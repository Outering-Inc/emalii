/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { cache } from 'react'
import { connectToDatabase } from '../db/dbConnect'
import OrderModel from '../db/models/orderModel'
import MpesaTransaction, { IMpesaTransaction } from '../db/models/mpesaModel'
import MpesaCheckoutMapping from '../db/models/mpesaCheckout.model'
import { mpesa } from '../payments/mpesa/safaricom'
import { formatError } from '../utils/utils'
import { normalizeKenyanPhone } from '../utils/mpesa'

export const createMpesaOrder = cache(async (orderId: string) => {
  await connectToDatabase()

  try {
    // 1️⃣ Fetch order
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')

    // 2️⃣ Normalize phone
    const phone = normalizeKenyanPhone(order.shippingAddress.phone)

    // 🔒 3️⃣ STK RETRY SUPPRESSION (app-level)
    const existingTx = (await MpesaTransaction.findOne({
      orderId: order._id,
      status: { $in: ['PENDING', 'SUCCESS'] },
    })) as IMpesaTransaction | null

    if (existingTx) {
      return {
        success: true,
        message: 'Payment already initiated',
        data: {
          transactionId: existingTx._id.toString(),
          checkoutRequestId: existingTx.checkoutRequestId,
          merchantRequestId: existingTx.merchantRequestId,
          amount: existingTx.amount,
          phone: existingTx.phone,
          status: existingTx.status,
        },
      }
    }

    // 4️⃣ Initiate STK Push
    const amount = Math.ceil(order.totalPrice)
    const response = await mpesa.initiateStkPush(amount, phone)

    if (!response?.CheckoutRequestID) {
      throw new Error('Failed to initiate Mpesa STK push')
    }

    // 5️⃣ Persist checkout mapping
    await MpesaCheckoutMapping.create({
      orderId: order._id.toString(),
      userId: order.user.toString(),
      checkoutRequestId: response.CheckoutRequestID,
    })

    // 6️⃣ Create Mpesa transaction
    const transaction = (await MpesaTransaction.create({
      orderId: order._id,
      user: order.user,
      phone,
      amount,
      status: 'PENDING',
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
      paymentData: response,
    })) as IMpesaTransaction

    // 7️⃣ Success response
    return {
      success: true,
      message: 'Mpesa STK push initiated successfully',
      data: {
        transactionId: transaction._id.toString(),
        checkoutRequestId: transaction.checkoutRequestId,
        merchantRequestId: transaction.merchantRequestId,
        amount: transaction.amount,
        phone: transaction.phone,
        status: transaction.status,
      },
    }
  } catch (err: any) {
    /**
     * 🔐 DATABASE-LEVEL RETRY SUPPRESSION
     * Handles race conditions (duplicate PENDING insert)
     */
    if (err?.code === 11000) {
      const tx = (await MpesaTransaction.findOne({
        orderId,
        status: 'PENDING',
      })) as IMpesaTransaction | null

      if (tx) {
        return {
          success: true,
          message: 'Payment already initiated',
          data: {
            transactionId: tx._id.toString(),
            checkoutRequestId: tx.checkoutRequestId,
            merchantRequestId: tx.merchantRequestId,
            amount: tx.amount,
            phone: tx.phone,
            status: tx.status,
          },
        }
      }
    }

    // ❌ Fallback error
    return {
      success: false,
      message: formatError(err),
    }
  }
})
