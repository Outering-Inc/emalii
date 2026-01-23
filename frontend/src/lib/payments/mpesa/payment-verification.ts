/* eslint-disable @typescript-eslint/no-explicit-any */

import { RawMpesaCallback } from '@/src/types/mpesa'
import { ParsedMpesaCallback, validateCallback } from './validateCallback'

/**
 * Verify Mpesa payment.
 * @param paymentData - the raw data returned by STK push callback or frontend
 */
export async function verifyMpesaPayment(paymentData: any): Promise<boolean> {
  try {
    // Assume paymentData comes from your webhook or frontend
    // If using STK push, you may store the CheckoutRequestID in DB and verify against callback
    const callback: RawMpesaCallback = paymentData

    const parsed: ParsedMpesaCallback = validateCallback(callback)

    // Check that resultCode indicates success
    if (parsed.resultCode !== 0) {
      console.error('Mpesa payment failed:', parsed.resultDesc)
      return false
    }

    // ✅ Payment succeeded
    return true
  } catch (err: any) {
    console.error('Error verifying Mpesa payment:', err.message)
    return false
  }
}
