/* eslint-disable @typescript-eslint/no-unused-vars */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { z } from 'zod'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'
import webhookEventModel from '@/src/lib/db/models/webhookEventModel'

import {
  PaymentMethod,
  PaymentResult,
} from '@/src/lib/payments/reconciliation/type'

import { verifyPayPalWebhookSignature } from '@/src/lib/payments/paypal/verifyWebhook'
import { guardWebhookReplay } from '@/src/lib/security/webhookIdempotency'
import { emitPaymentEvent } from '@/src/lib/socket/events/paymentEvents'

/* ================= ENV GUARD ================= */
if (
  !process.env.PAYPAL_WEBHOOK_ID ||
  !process.env.PAYPAL_APP_SECRET ||
  !process.env.PAYMENT_CURRENCY
) {
  throw new Error('Missing PayPal env variables')
}

/* ================= PAYPAL SCHEMA ================= */
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
    custom_id: z.string().optional(),
    supplementary_data: z
      .object({
        related_ids: z
          .object({
            order_id: z.string().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
  time_created: z.string(),
})

/* ================= WEBHOOK HANDLER ================= */
export async function POST(req: NextRequest) {
  await connectToDatabase()

  const rawBody = await req.text()

  /* ================= VERIFY SIGNATURE ================= */
  const isValid = await verifyPayPalWebhookSignature(req, rawBody)
    if (!isValid) {
      return NextResponse.json({ message: 'Invalid signature' }, { status: 400 })
    }

  let payload: z.infer<typeof paypalWebhookSchema>
  try {
    payload = paypalWebhookSchema.parse(JSON.parse(rawBody))
  } catch {
    return NextResponse.json({ received: true })
  }

  /* ================= GLOBAL IDEMPOTENCY ================= */
  const isNew = await guardWebhookReplay('paypal', payload.id)
  if (!isNew) {
    return NextResponse.json({ received: true })
  }

  /* ================= EVENT FILTER ================= */
  if (payload.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ received: true })
  }

  const orderId =
    payload.resource.custom_id ||
    payload.resource.supplementary_data?.related_ids?.order_id

  if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
    console.error('[PayPalWebhook] Invalid orderId', {
      eventId: payload.id,
    })
    return NextResponse.json({ received: true })
  }

  /* ================= SANITY CHECKS ================= */
  if (payload.resource.status !== 'COMPLETED') {
    return NextResponse.json({ received: true })
  }

  if (
    payload.resource.amount.currency_code !==
    process.env.PAYMENT_CURRENCY
  ) {
    console.error('[PayPalWebhook] Currency mismatch', {
      eventId: payload.id,
    })
    return NextResponse.json({ received: true })
  }

  const amount = Number(payload.resource.amount.value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ received: true })
  }

  /* ================= TRANSACTION ================= */
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    /* ================= EVENT LEDGER ================= */
    await webhookEventModel.create(
      [
        {
          provider: 'paypal',
          eventId: payload.id,
          orderId,
          receivedAt: new Date(),
          payloadHash: payload.id,
        },
      ],
      { session }
    )

    /* ================= PAYMENT RESULT ================= */
    const paymentResult: PaymentResult = {
      id: payload.resource.id,
      status: 'SUCCESS',
      pricePaid: amount,
      raw: payload.resource,
    }

    /* ================= ENQUEUE JOB ================= */
    await paymentJobModel.findOneAndUpdate(
      {
        orderId,
        providerReference: paymentResult.id,
      },
      {
        orderId,
        providerReference: paymentResult.id,
        paymentMethod: PaymentMethod.PayPal,
        paymentData: paymentResult,
        status: 'PENDING',
        attempts: 0,
        correlationId: payload.id,
      },
      { upsert: true, session }
    )

    await session.commitTransaction()
  } catch (err) {
    await session.abortTransaction()
    console.error('[PayPalWebhook] Transaction failed', {
      eventId: payload.id,
      orderId,
    })
  } finally {
    session.endSession()
  }

  /* ================= SOCKET NOTIFY (BEST EFFORT) ================= */
  emitPaymentEvent(orderId.toString(), {
    provider: 'paypal',
    status: 'PENDING',
  })

  /* ================= ACK ================= */
  return NextResponse.json({ received: true })
}
