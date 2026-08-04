'use server'

import { cache } from 'react'
import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '../../db/dbConnect'
import { paypal } from './paypal'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'
import { formatError } from '../../utils/utils'
import { PaymentMethod } from '../reconciliation/type'

export const approvePayPalOrder = cache(
  async (orderId: string, data: { orderID: string }) => {
    await connectToDatabase()

    try {
      /* ===============================
         1️⃣ CAPTURE PAYMENT
      =============================== */
      const capture = await paypal.capturePayment(data.orderID)

      if (!capture || capture.status !== 'COMPLETED') {
        throw new Error('PayPal capture not completed')
      }

      const captureId =
        capture.purchase_units?.[0]?.payments?.captures?.[0]?.id

      if (!captureId) {
        throw new Error('Missing capture ID')
      }

      /* ===============================
         2️⃣ ENQUEUE PAYMENT JOB (IDEMPOTENT)
      =============================== */
      await paymentJobModel.findOneAndUpdate(
        {
          orderId,
          providerReference: captureId,
        },
        {
          orderId,
          providerReference: captureId,
          paymentMethod: PaymentMethod.PayPal,
          paymentData: capture,
          status: 'PENDING',
          attempts: 0,
        },
        { upsert: true }
      )

      /* ===============================
         3️⃣ RETURN SUCCESS (NO FINALIZE HERE)
      =============================== */
      revalidatePath(`/account/orders/${orderId}`)

      return {
        success: true,
        message: 'Payment is being processed',
      }
    } catch (err) {
      return {
        success: false,
        message: formatError(err),
      }
    }
  }
)
