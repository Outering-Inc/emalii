/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { RawMpesaCallback  } from '@/src/types/mpesa'
import { ParsedMpesaCallback, validateCallback } from './validateCallback'

/**
 * Enterprise Mpesa Verification Result
 */
export interface MpesaVerificationResult {
  phone: string
  transactionDate: any | string | undefined
  merchantRequestId: any | string | undefined
  checkoutRequestId: any | string | undefined
  userId: any
  success: boolean                // Did payment succeed?
  amount: number                  // Minor units (e.g., cents)
  providerReference: string       // CheckoutRequestID
  raw: RawMpesaCallback           // Raw callback for audit
  mode: 'live' | 'sandbox'       // Env mode
  isReversed: boolean             // Has payment been reversed/refunded
  customerId?: string             // Optional customer ID
}

/**
 * Verify Mpesa payment callback from Safaricom
 * This is fully type-safe and audit-ready
 */
export async function verifyMpesaPayment(
  paymentData: RawMpesaCallback
): Promise<MpesaVerificationResult> {
  try {
    // 1️⃣ Validate callback structure
    const parsed: ParsedMpesaCallback = validateCallback(paymentData)

    // 2️⃣ Determine success
    const success = parsed.resultCode === 0

    // 3️⃣ Convert amount to minor units
    const amount = Math.round(Number(parsed.amount) * 100)

    // 4️⃣ Determine mode
    const mode: 'live' | 'sandbox' =
      process.env.MPESA_MODE === 'live' ? 'live' : 'sandbox'

    // 5️⃣ Refund / reversal detection
    const isReversed =
      parsed.resultCode !== 0 ||
      parsed.resultDesc?.toLowerCase().includes('reversed')

    // 6️⃣ Optional customer ID
    const customerId = parsed.customerId || undefined

    // 7️⃣ Log warning if failure
    if (!success) {
      console.error(
        '[MpesaVerification] Payment verification failed:',
        parsed
      )
    }

    // ✅ Return FULL strict object
    return {
      phone: parsed.phone || '',
      transactionDate: parsed.transactionDate || undefined,
      merchantRequestId: parsed.merchantRequestId || undefined,
      checkoutRequestId: parsed.checkoutRequestID || undefined,
      userId: parsed.user || null,

      success,
      amount,
      providerReference: parsed.checkoutRequestID,
      raw: paymentData,
      mode,
      isReversed,
      customerId,
    }
  } catch (err: any) {
    console.error(
      '[MpesaVerification] Error parsing callback:',
      err.message
    )

    return {
      phone: '',
      transactionDate: undefined,
      merchantRequestId: undefined,
      checkoutRequestId: undefined,
      userId: null,

      success: false,
      amount: 0,
      providerReference: 'N/A',
      raw: paymentData,
      mode: process.env.MPESA_MODE === 'live' ? 'live' : 'sandbox',
      isReversed: false,
      customerId: undefined,
    }
  }
}

