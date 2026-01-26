'use server'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentMethod } from '@/src/lib/payments/reconciliation/type'


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
    // 1️⃣ Validate payload
    const parsed = paypalWebhookSchema.parse(body)

    // 2️⃣ Only process completed payments
    if (parsed.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ message: 'Event ignored' })
    }

    // 3️⃣ Map PayPal orderId to internal orderId
    const paypalOrderId = parsed.resource.id

    const order = await OrderModel.findOne({
      'paymentResult.id': paypalOrderId,
    })

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

     // 4️⃣ Delegate to orchestrator
    await finalizePayment({
      orderId: order._id.toString(),
      paymentMethod: PaymentMethod.PayPal,
      paymentData: parsed.resource,
    })

    // 5️⃣ Respond to PayPal
    return NextResponse.json({ message: 'PayPal webhook processed successfully' })
  } catch (err) {
    console.error('PayPal webhook error:', err)
    return NextResponse.json({ message: 'Webhook error' }, { status: 500 })
  }
}
