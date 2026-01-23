/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' })

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ message: 'Missing Stripe signature' }, { status: 400 })

  const buf = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Stripe webhook signature error', err)
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
  }

  // Handle only payment success
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const orderId = paymentIntent.metadata.orderId

    if (!orderId) return NextResponse.json({ message: 'Missing orderId in metadata' }, { status: 400 })

    // Delegate to orchestrator
    try {
      await finalizePayment({
        orderId,
        paymentMethod: 'Stripe',
        paymentData: paymentIntent,
      })
      return NextResponse.json({ message: 'Stripe payment processed successfully' })
    } catch (err: any) {
      console.error('Stripe payment processing error', err)
      return NextResponse.json({ message: 'Error finalizing payment', error: err.message }, { status: 500 })
    }
  }

  // Ignore other events
  return NextResponse.json({ message: 'Event ignored' })
}
