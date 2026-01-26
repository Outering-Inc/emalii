// src/lib/payments/mpesa/payment-verification.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RawMpesaCallback } from '@/src/types/mpesa'
import { ParsedMpesaCallback, validateCallback } from './validateCallback'

// ✅ Make sure this interface is exported
export interface MpesaVerificationResult {
  success: boolean
  amount: number
  providerReference: string
  raw: any
}

// ✅ Make sure function is exported
export async function verifyMpesaPayment(paymentData: any): Promise<MpesaVerificationResult> {
  try {
    const callback: RawMpesaCallback = paymentData
    const parsed: ParsedMpesaCallback = validateCallback(callback)

    const paidAmount = Number(parsed.amount)
    const reference = parsed.checkoutRequestID

    const success = parsed.resultCode === 0
    if (!success) console.error('Mpesa payment failed:', parsed.resultDesc)

    return {
      success,
      amount: paidAmount,
      providerReference: reference,
      raw: paymentData,
    }
  } catch (err: any) {
    console.error('Error verifying Mpesa payment:', err.message)
    return {
      success: false,
      amount: 0,
      providerReference: 'N/A',
      raw: paymentData,
    }
  }
}
