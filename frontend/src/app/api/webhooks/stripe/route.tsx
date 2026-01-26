/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentMethod } from '@/src/lib/payments/reconciliation/type'

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe env variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
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

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ message: 'Event ignored' })
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent
  const orderId = paymentIntent.metadata?.orderId

  if (!orderId) {
    return NextResponse.json({ message: 'Missing orderId in metadata' }, { status: 400 })
  }

  await finalizePayment({
    orderId,
    paymentMethod: PaymentMethod.Stripe,
    paymentData: {
      id: paymentIntent.id,
      amount: paymentIntent.amount_received / 100,
      currency: paymentIntent.currency,
      raw: paymentIntent,
    },
  })

  return NextResponse.json({ message: 'Stripe payment processed successfully' })
}
