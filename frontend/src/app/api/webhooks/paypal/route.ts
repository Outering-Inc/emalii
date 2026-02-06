'use server'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'
import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'

// Zod schema for PayPal webhook event
const paypalWebhookSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    status: z.string(),
    amount: z.object({
      currency_code: z.string(),
      value: z.string(),
    }),
    payer: z.object({
      email_address: z.string(),
    }),
  }),
})

export async function POST(req: Request) {
  await connectToDatabase()

  try {
    const body = await req.json()

    // 1️⃣ Validate webhook payload
    const parsed = paypalWebhookSchema.parse(body)

    // 2️⃣ Only process completed captures
    if (parsed.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    // 3️⃣ Find internal order
    const order = await OrderModel.findOne({
      'paymentResult.id': parsed.resource.id,
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    // 4️⃣ Normalize PayPal → Payment Result
    const paymentResult: PaymentResult = {
      id: parsed.resource.id,
      status: parsed.resource.status,
      pricePaid: Number(parsed.resource.amount.value),
      raw: parsed.resource,
    }

    // 5️⃣ 🔹 Enqueue payment job (instead of finalizing)
    await paymentJobModel.findOneAndUpdate(
      { orderId: order._id, providerReference: paymentResult.id },
      {
        orderId: order._id,
        paymentMethod: PaymentMethod.PayPal,
        paymentData: paymentResult,
        providerReference: paymentResult.id,
        status: 'PENDING',
        attempts: 0,
      },
      { upsert: true }
    )

    return NextResponse.json({ message: 'PayPal webhook enqueued successfully' })
  } catch (err) {
    console.error('PayPal webhook error:', err)
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 })
  }
}
