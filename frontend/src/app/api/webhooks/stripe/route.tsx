/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'
import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'
import { connectToDatabase } from '@/src/lib/db/dbConnect'

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe env variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  await connectToDatabase()

  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ message: 'Missing Stripe signature' }, { status: 400 })
  }

  const payload = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[Stripe Webhook] Signature verification failed', err.message)
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  // Only handle successful payment_intent events
  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ message: 'Event ignored' })
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) {
    return NextResponse.json({ message: 'Missing orderId in metadata' }, { status: 400 })
  }

  // 🔹 Normalize PaymentResult
  const paymentResult: PaymentResult = {
    id: paymentIntent.id,
    status: 'SUCCESS',
    pricePaid: paymentIntent.amount_received / 100,
    raw: paymentIntent,
  }

  // 🔹 Enqueue Stripe payment job instead of finalizing immediately
  await paymentJobModel.findOneAndUpdate(
    { orderId, providerReference: paymentResult.id },
    {
      orderId,
      providerReference: paymentResult.id,
      paymentMethod: PaymentMethod.Stripe,
      paymentData: paymentResult,
      status: 'PENDING',
      attempts: 0,
    },
    { upsert: true }
  )

  return NextResponse.json({ message: 'Stripe payment enqueued successfully' })
}
