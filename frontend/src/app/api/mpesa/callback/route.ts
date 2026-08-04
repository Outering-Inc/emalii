'use server'

import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import MpesaCheckoutMapping from '@/src/lib/db/models/mpesaCheckout.model'
import paymentJobModel from '@/src/lib/db/models/paymentJobModel'

import { validateCallback } from '@/src/lib/payments/mpesa/validateCallback'
import type { ParsedMpesaCallback } from '@/src/lib/payments/mpesa/validateCallback'

import { PaymentMethod } from '@/src/lib/payments/reconciliation/type'
import { getSocketServer } from '@/src/lib/socket/server'

import { isSafaricomIp } from '@/src/lib/security/isSafaricomIp'
import { verifyMpesaSignature } from '@/src/lib/security/mpesaSignature'

/* ---------------- Metadata schema ---------------- */
const callbackSchema = z.object({
  user: z.string().optional(),
  orderId: z.string().optional(),
})

/* ---------------- Callback Entry ---------------- */
export async function POST(req: Request) {
  await connectToDatabase()

  try {
    /* =========================
       0️⃣ Security Layer (NEW)
    ========================== */

    // Get client IP
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0] || null

    if (!isSafaricomIp(ip)) {
      console.warn('[MpesaCallback] Invalid IP:', ip)

      // 🔥 Amazon rule: ALWAYS ACK
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      })
    }

    // Read RAW body for signature verification
    const rawBody = await req.text()

    const signature = req.headers.get('x-mpesa-signature')

    const isValidSignature = verifyMpesaSignature(
      rawBody,
      signature,
      process.env.MPESA_WEBHOOK_SECRET!
    )

    if (!isValidSignature) {
      console.warn('[MpesaCallback] Invalid signature')

      // 🔥 Always ACK
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      })
    }

    // Parse JSON AFTER signature verification
    const body = JSON.parse(rawBody)
    const meta = callbackSchema.safeParse(body)

    /* =========================
       1️⃣ Validate & normalize callback
    ========================== */

    const parsed: ParsedMpesaCallback = validateCallback(body)

    if (meta.success) {
      parsed.user ??= meta.data.user
      parsed.orderId ??= meta.data.orderId
    }

    /* =========================
       2️⃣ Resolve order via checkout mapping
    ========================== */

    const mapping = await MpesaCheckoutMapping.findOne({
      checkoutRequestId: parsed.checkoutRequestID,
    })

    if (mapping) {
      parsed.orderId ??= mapping.orderId.toString()
      parsed.user ??= mapping.userId.toString()
    }

    if (!parsed.orderId) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
    }

    /* =========================
       3️⃣ Persist Mpesa transaction
    ========================== */

    const transaction = await MpesaTransaction.findOneAndUpdate(
      { checkoutRequestId: parsed.checkoutRequestID },
      {
        phone: parsed.phone,
        amount: parsed.amount,
        mpesaReceiptNumber: parsed.mpesaReceiptNumber,
        transactionDate: parsed.transactionDate,
        resultCode: parsed.resultCode,
        resultDesc: parsed.resultDesc,
        merchantRequestId: parsed.merchantRequestId,
        checkoutRequestId: parsed.checkoutRequestID,
        status: parsed.resultCode === 0 ? 'SUCCESS' : 'FAILED',
        user: parsed.user ? new mongoose.Types.ObjectId(parsed.user) : undefined,
        orderId: new mongoose.Types.ObjectId(parsed.orderId),
        paymentData: parsed,
      },
      { upsert: true, new: true }
    )

    /* =========================
       4️⃣ Emit real-time socket
    ========================== */

    const io = getSocketServer()
    io?.emit(`mpesa:${parsed.checkoutRequestID}`, {
      status: transaction.status,
    })

    /* =========================
       5️⃣ Enqueue payment job
    ========================== */

    if (parsed.resultCode === 0 && parsed.mpesaReceiptNumber) {
      await paymentJobModel.findOneAndUpdate(
        {
          orderId: parsed.orderId,
          providerReference: parsed.mpesaReceiptNumber,
        },
        {
          orderId: parsed.orderId,
          providerReference: parsed.mpesaReceiptNumber,
          paymentMethod: PaymentMethod.Mpesa,
          paymentData: {
            id: parsed.mpesaReceiptNumber,
            status: 'SUCCESS',
            pricePaid: parsed.amount,
            raw: parsed,
          },
          status: 'PENDING',
        },
        { upsert: true }
      )
    }

    /* =========================
       6️⃣ ALWAYS ACK PROVIDER
    ========================== */

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })

  } catch (err) {
    console.error('[MpesaCallback]', err)

    // 🔥 Amazon rule — NEVER fail webhook
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })
  }
}
