/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { Types } from 'mongoose'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import { connectToDatabase } from '@/src/lib/db/dbConnect'

import { emitPaymentEvent } from '../../socket/events/paymentEvents'
import { toMinorUnits } from '../../utils/utils'
import {
  MpesaVerificationResult,
  verifyMpesaPayment,
} from '../mpesa/payment-verification'
import {
  ReconciliationResult,
  ReconciliationStatus,
} from '../reconciliation/type'

export interface MpesaReconciliationInput {
  paymentData: any
  orderId: string
  expectedAmount: number
  expectedCurrency: string
  customerId?: string
}

export async function mpesaReconciliation(
  input: MpesaReconciliationInput
): Promise<ReconciliationResult> {
  const { paymentData, orderId, expectedAmount, expectedCurrency, customerId } =
    input

  const requestId =
    paymentData?.Body?.stkCallback?.CheckoutRequestID

  try {
    /* ======================================================
       1️⃣ VERIFY PAYMENT (NO LOGIC CHANGED)
    ======================================================= */
    const verification: MpesaVerificationResult =
      await verifyMpesaPayment(paymentData)

    const paidAmount = toMinorUnits(String(verification.amount))
    const providerReference = verification.providerReference

    /* ======================================================
       2️⃣ LIVE MODE VALIDATION (UNCHANGED)
    ======================================================= */
    if (
      verification.mode === 'sandbox' &&
      process.env.NODE_ENV === 'production'
    ) {
      return failed(
        'Sandbox payment not allowed in production',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       3️⃣ REVERSAL / REFUND DETECTION (UNCHANGED)
    ======================================================= */
    if (verification.isReversed) {
      return failed(
        'Payment reversed by provider',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       4️⃣ DATABASE IDEMPOTENCY CHECK (REPLACES SET)
    ======================================================= */
    await connectToDatabase()

    const existingTransaction =
      await MpesaTransaction.findOne({
        mpesaReceiptNumber: providerReference,
        status: 'SUCCESS',
      })

    if (existingTransaction) {
      console.warn(
        `[MpesaReconciliation] Duplicate webhook detected`,
        { orderId, providerReference }
      )

      return {
        status: ReconciliationStatus.MATCHED,
        providerStatus: 'SUCCESS',
        providerReference,
        paidAmount,
        expectedAmount,
        raw: verification.raw,
        reconciledAt: existingTransaction.updatedAt,
      }
    }

    /* ======================================================
       5️⃣ VERIFICATION FAILED (UNCHANGED)
    ======================================================= */
    if (!verification.success) {
      return failed(
        'Mpesa verification failed',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       6️⃣ AMOUNT VALIDATION (UNCHANGED)
    ======================================================= */
    if (paidAmount !== expectedAmount) {
      return mismatch(
        'Amount mismatch',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       7️⃣ CURRENCY VALIDATION (UNCHANGED)
    ======================================================= */
    if (expectedCurrency.toUpperCase() !== 'KES') {
      return mismatch(
        'Currency mismatch',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       8️⃣ CUSTOMER VALIDATION (UNCHANGED)
    ======================================================= */
    if (
      customerId &&
      verification.customerId &&
      customerId !== verification.customerId
    ) {
      return failed(
        'Customer ID mismatch',
        providerReference,
        paidAmount,
        expectedAmount,
        verification.raw
      )
    }

    /* ======================================================
       9️⃣ INSERT SUCCESS TRANSACTION (ATOMIC)
    ======================================================= */
    try {
      await MpesaTransaction.create({
        phone: verification.phone || 'N/A',
        amount: verification.amount,
        mpesaReceiptNumber: providerReference,
        transactionDate: verification.transactionDate,
        resultCode: 0,
        resultDesc: 'Success',
        merchantRequestId: verification.merchantRequestId,
        checkoutRequestId: verification.checkoutRequestId,
        status: 'SUCCESS',
        user: verification.userId
          ? new Types.ObjectId(verification.userId)
          : new Types.ObjectId(),
        orderId: new Types.ObjectId(orderId),
        paymentData,
      })
    } catch (error: any) {
      if (error.code === 11000) {
        console.warn(
          `[MpesaReconciliation] Duplicate insert blocked by DB`,
          { providerReference }
        )

        return {
          status: ReconciliationStatus.MATCHED,
          providerStatus: 'SUCCESS',
          providerReference,
          paidAmount,
          expectedAmount,
          raw: verification.raw,
          reconciledAt: new Date(),
        }
      }

      throw error
    }

    /* ======================================================
       🔟 STRUCTURED EVENT EMISSION (UNCHANGED)
    ======================================================= */
    emitPaymentEvent(orderId, {
      provider: 'mpesa',
      status: 'SUCCESS',
      paidAmount,
      expectedAmount,
      providerReference,
      timestamp: Date.now(),
    } as any)

    /* ======================================================
       ✅ SUCCESS
    ======================================================= */
    return {
      status: ReconciliationStatus.MATCHED,
      providerStatus: 'SUCCESS',
      providerReference,
      paidAmount,
      expectedAmount,
      raw: verification.raw,
      reconciledAt: new Date(),
    }
  } catch (error: any) {
    return {
      status: ReconciliationStatus.FAILED,
      providerStatus: 'ERROR',
      providerReference: requestId || 'N/A',
      paidAmount: 0,
      expectedAmount,
      failureReason: error.message || 'Unknown error',
      raw: paymentData,
      reconciledAt: new Date(),
    }
  }
}

/* ===============================
   Helpers (UNCHANGED)
================================= */

function failed(
  reason: string,
  providerReference: string,
  paidAmount: number,
  expectedAmount: number,
  raw: any
): ReconciliationResult {
  return {
    status: ReconciliationStatus.FAILED,
    providerStatus: 'FAILED',
    providerReference,
    paidAmount,
    expectedAmount,
    failureReason: reason,
    raw,
    reconciledAt: new Date(),
  }
}

function mismatch(
  reason: string,
  providerReference: string,
  paidAmount: number,
  expectedAmount: number,
  raw: any
): ReconciliationResult {
  return {
    status: ReconciliationStatus.MISMATCH,
    providerStatus: 'MISMATCH',
    providerReference,
    paidAmount,
    expectedAmount,
    failureReason: reason,
    raw,
    reconciledAt: new Date(),
  }
}
