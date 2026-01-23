// Imports
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import MpesaCheckoutMapping from '@/src/lib/db/models/mpesaCheckout.model'

import { validateCallback } from '@/src/lib/payments/mpesa/validateCallback'
import type { MpesaCallback } from '@/src/types/mpesa'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'

//──────────────────────────────────────────────
// 1️⃣ Zod schema (optional metadata from frontend)
//──────────────────────────────────────────────
const callbackSchema = z.object({
  user: z.string().optional(),
  orderId: z.string().optional(),
})

//──────────────────────────────────────────────
// 2️⃣ POST: Mpesa Callback Entry Point
//──────────────────────────────────────────────
export async function POST(req: Request) {
  await connectToDatabase()

  try {
    const body = await req.json()

    //──────────────────────────────────────────────
    // 3️⃣ Validate optional callback metadata
    //──────────────────────────────────────────────
    const meta = callbackSchema.parse(body)

    //──────────────────────────────────────────────
    // 4️⃣ Validate & normalize Mpesa payload
    //──────────────────────────────────────────────
    const parsed: MpesaCallback = validateCallback(body)
    parsed.user = meta.user
    parsed.orderId = meta.orderId

    if (!parsed.checkoutRequestID || !parsed.mpesaReceiptNumber) {
      return NextResponse.json(
        { error: 'Invalid Mpesa callback payload' },
        { status: 400 }
      )
    }

    //──────────────────────────────────────────────
    // 5️⃣ Resolve order/user from checkout mapping
    //──────────────────────────────────────────────
    const mapping = await MpesaCheckoutMapping.findOne({
      checkoutRequestId: parsed.checkoutRequestID,
    })

    if (mapping) {
      parsed.orderId ??= mapping.orderId
      parsed.user ??= mapping.userId
    }

    //──────────────────────────────────────────────
    // 6️⃣ Persist Mpesa transaction (idempotent)
    //──────────────────────────────────────────────
    await MpesaTransaction.findOneAndUpdate(
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
        user: parsed.user
          ? new mongoose.Types.ObjectId(parsed.user)
          : undefined,
        orderId: parsed.orderId
          ? new mongoose.Types.ObjectId(parsed.orderId)
          : undefined,
      },
      { upsert: true, new: true }
    )

    //──────────────────────────────────────────────
    // 7️⃣ Delegate business logic to orchestrator
    //──────────────────────────────────────────────
    if (parsed.resultCode === 0 && parsed.orderId) {
      await finalizePayment({
        orderId: parsed.orderId,
        paymentMethod: 'Mpesa',
        paymentData: parsed,
      })
    }

    //──────────────────────────────────────────────
    // 8️⃣ ACK Mpesa (always respond 200)
    //──────────────────────────────────────────────
    return NextResponse.json({ message: 'Callback processed' })
  } catch (error) {
    console.error('Mpesa callback error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
