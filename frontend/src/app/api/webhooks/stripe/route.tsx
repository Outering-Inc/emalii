/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import mongoose from 'mongoose'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'

import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'
import stripeEventModel from '@/src/lib/db/models/stripeEventModel'  // ⬅ NEW (event idempotency)

/* ================= ENV GUARD ================= */
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing Stripe env variables')
}

/* ================= STRIPE CLIENT ================= */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

/* ================= WEBHOOK HANDLER ================= */
export async function POST(req: NextRequest) {
  await connectToDatabase()

  /* ================= RAW BODY ================= */
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json(
      { message: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  const rawBody = await req.text()
  let event: Stripe.Event

  /* ================= VERIFY SIGNATURE ================= */
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[StripeWebhook] Invalid signature', err.message)
    return NextResponse.json(
      { message: 'Invalid signature' },
      { status: 400 }
    )
  }

  /* ================= EVENT IDEMPOTENCY (AMAZON STYLE) ================= */
  const existingEvent = await stripeEventModel.findOne({ eventId: event.id })
  if (existingEvent) {
    // 🔁 Stripe retry or replay → ACK safely
    return NextResponse.json({ received: true })
  }

  await stripeEventModel.create({
    eventId: event.id,
    type: event.type,
    createdAt: new Date(),
  })

  /* ================= ACCEPT ONLY SUCCESS EVENTS ================= */
  if (
    event.type !== 'payment_intent.succeeded' &&
    event.type !== 'charge.succeeded'
  ) {
    return NextResponse.json({ received: true })
  }

  /* ================= NORMALIZE PAYMENT ================= */
  const paymentIntent =
    event.type === 'payment_intent.succeeded'
      ? (event.data.object as Stripe.PaymentIntent)
      : null

  if (!paymentIntent) {
    return NextResponse.json({ received: true })
  }

  const orderId = paymentIntent.metadata?.orderId
  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    console.error('[StripeWebhook] Missing or invalid orderId', {
      eventId: event.id,
    })
    return NextResponse.json({ received: true })
  }

  /* ================= BASIC SANITY CHECKS ================= */
  if (
    paymentIntent.amount_received <= 0 ||
    paymentIntent.status !== 'succeeded'
  ) {
    console.error('[StripeWebhook] Invalid payment state', {
      paymentIntentId: paymentIntent.id,
    })
    return NextResponse.json({ received: true })
  }

  /* ================= NORMALIZED PAYMENT RESULT ================= */
  const paymentResult: PaymentResult = {
    id: paymentIntent.id,
    status: 'SUCCESS',
    pricePaid: paymentIntent.amount_received / 100,
    raw: paymentIntent,
  }

  /* ================= ENQUEUE PAYMENT JOB ================= */
  await paymentJobModel.findOneAndUpdate(
    {
      orderId,
      providerReference: paymentResult.id,
    },
    {
      orderId,
      providerReference: paymentResult.id,
      paymentMethod: PaymentMethod.Stripe,
      paymentData: paymentResult,
      status: 'PENDING',
      attempts: 0,
      correlationId: event.id, // 🔍 observability
    },
    { upsert: true }
  )

  /* ================= ACK STRIPE (CRITICAL) ================= */
  return NextResponse.json({ received: true })
}
