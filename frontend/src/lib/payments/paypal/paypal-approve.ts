// src/lib/server/paypal-approve.ts
'use server'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '../../db/dbConnect'
import { paypal } from './paypal'
import { finalizePayment } from '../orchestrator/payment-orchestrator'
import { formatError } from '../../utils/utils'

export const approvePayPalOrder = cache(
  async (orderId: string, data: { orderID: string }) => {
    await connectToDatabase()

    try {
      // 1️⃣ Capture payment from PayPal
      const captureData = await paypal.capturePayment(data.orderID)

      if (captureData.status !== 'COMPLETED') {
        throw new Error('Invalid PayPal capture')
      }

      // 2️⃣ Delegate EVERYTHING to orchestrator (DRY)
      await finalizePayment({
        orderId,
        paymentMethod: 'PayPal',
        paymentData: captureData,
      })

      // 3️⃣ Refresh UI
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
