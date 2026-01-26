/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose'
import { NextResponse } from 'next/server'
import { z } from 'zod'

import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import MpesaCheckoutMapping from '@/src/lib/db/models/mpesaCheckout.model'
import { validateCallback } from '@/src/lib/payments/mpesa/validateCallback'
import type { MpesaCallback } from '@/src/types/mpesa'
import { reconcileOrderPayment } from '@/src/lib/payments/orchestrator/reconciliation-orchestrator'
import { finalizePayment } from '@/src/lib/payments/orchestrator/payment-orchestrator'
import { PaymentMethod, PaymentResult } from '@/src/lib/payments/reconciliation/type'


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
    const meta = callbackSchema.parse(body)

    // Validate & normalize Mpesa payload
    const parsed: MpesaCallback = validateCallback(body)
    parsed.user = meta.user
    parsed.orderId = meta.orderId

    if (!parsed.checkoutRequestID || !parsed.mpesaReceiptNumber) {
      return NextResponse.json(
        { error: 'Invalid Mpesa callback payload' },
        { status: 400 }
      )
    }

    // Resolve order/user via checkout mapping
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

    // Persist Mpesa transaction (idempotent)
    const transaction = (await MpesaTransaction.findOneAndUpdate(
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
        paymentData: parsed, // raw callback for audit & reconciliation
      },
      { upsert: true, new: true }
    ).lean()) as unknown as {
      _id: mongoose.Types.ObjectId
      paymentData: PaymentResult
      status: string
    }

    // ✅ Only reconcile if payment succeeded
    if (parsed.resultCode === 0 && transaction.paymentData) {
      // Prepare PaymentResult object safely
      const paymentResult: PaymentResult = {
        id: transaction.paymentData.id ?? 'N/A',
        status: transaction.paymentData.status ?? 'UNKNOWN',
        email_address: transaction.paymentData.email_address ?? '',
        pricePaid: transaction.paymentData.pricePaid ?? 0,
        raw: (transaction.paymentData as any)?.raw ?? {},
      }

      // Reconcile payment via orchestrator (delegates to Mpesa reconciliation)     
      const reconciliation = await reconcileOrderPayment(
          PaymentMethod.Mpesa,
          paymentResult,
          parsed.amount
        )

      // Finalize payment if reconciliation matched
      if (reconciliation.status === 'MATCHED') {
        await finalizePayment({
          orderId: parsed.orderId,
          paymentMethod: PaymentMethod.Mpesa,
          paymentData: paymentResult,
        })
      }
    }

    return NextResponse.json({
      message: 'Mpesa callback processed successfully',
      data: {
        transactionId: transaction._id.toString(),
        checkoutRequestId: parsed.checkoutRequestID,
        status: transaction.status,
      },
    })
  } catch (error) {
    console.error('Mpesa callback error:', error)
    return NextResponse.json(
      { message: 'Internal Server Error', error: (error as Error).message },
      { status: 500 }
    )
  }
}
