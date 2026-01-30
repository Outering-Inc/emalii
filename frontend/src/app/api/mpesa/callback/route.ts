'use server'

import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import MpesaCheckoutMapping from '@/src/lib/db/models/mpesaCheckout.model'

import { validateCallback } from '@/src/lib/payments/mpesa/validateCallback'
import type { ParsedMpesaCallback } from '@/src/lib/payments/mpesa/validateCallback'

import { reconcileOrderPayment } from '@/src/lib/payments/orchestrator/reconciliation-orchestrator'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'

// 🔔 Socket (ADDED – no logic change)
import { getSocketServer } from '@/src/lib/socket/server'

// ----------------------
// Optional metadata schema
// ----------------------
const callbackSchema = z.object({
  user: z.string().optional(),
  orderId: z.string().optional(),
})

// ----------------------
// Mpesa Callback Entry Point
// ----------------------
export async function POST(req: Request) {
  await connectToDatabase()

  try {
    const body = await req.json()
    const meta = callbackSchema.safeParse(body)

    // 1️⃣ Validate & normalize Mpesa payload
    const parsed: ParsedMpesaCallback = validateCallback(body)

    if (meta.success) {
      if (meta.data.user) parsed.user = meta.data.user
      if (meta.data.orderId) parsed.orderId = meta.data.orderId
    }

    // 2️⃣ Resolve order/user via checkout mapping (SOURCE OF TRUTH)
    const mapping = await MpesaCheckoutMapping.findOne({
      checkoutRequestId: parsed.checkoutRequestID,
    })

    if (mapping) {
      parsed.orderId ??= mapping.orderId.toString()
      parsed.user ??= mapping.userId.toString()
    }

    if (!parsed.orderId) {
      return NextResponse.json(
        { error: 'Order not found for callback' },
        { status: 404 }
      )
    }

    // 3️⃣ Persist Mpesa transaction (IDEMPOTENT)
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
        paymentData: parsed, // normalized callback snapshot
      },
      { upsert: true, new: true }
    )

    // 🔔 REAL-TIME NOTIFICATION (ADDED)
    // Does NOT affect logic; polling still works if socket fails
    const io = getSocketServer()
    io?.emit(`mpesa:${parsed.checkoutRequestID}`, {
      status: transaction.status, // SUCCESS | FAILED
    })

    // 4️⃣ ONLY reconcile successful payments
    if (parsed.resultCode === 0 && transaction.paymentData) {
      const paymentResult: PaymentResult = {
        id: parsed.mpesaReceiptNumber,
        status: 'SUCCESS',
        pricePaid: parsed.amount,
        raw: parsed,
      }

      const reconciliation = await reconcileOrderPayment(
        PaymentMethod.Mpesa,
        paymentResult,
        parsed.amount
      )

      // 5️⃣ Finalize order if reconciliation matched
      if (reconciliation.status === 'MATCHED') {
        await finalizePayment({
          orderId: parsed.orderId,
          paymentMethod: PaymentMethod.Mpesa,
          paymentData: paymentResult,
        })
      }
    }

    // 6️⃣ Always ACK Mpesa (CRITICAL)
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
      data: {
        checkoutRequestId: parsed.checkoutRequestID,
        status: transaction.status,
      },
    })
  } catch (error) {
    console.error('Mpesa callback error:', error)

    // 🔒 Still ACK Mpesa even on internal error
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    })
  }
}