/* eslint-disable @typescript-eslint/no-explicit-any */
import { MpesaVerificationResult, verifyMpesaPayment } from '../mpesa/payment-verification'
import { ReconciliationResult,  ReconciliationStatus } from './type'


/**
 * Reconcile Mpesa payment for a single order
 * Uses your verification result type for safety and DRY
 */
export async function mpesaReconciliation(
  paymentData: any,
  expectedAmount: number
): Promise<ReconciliationResult> {
  const verification: MpesaVerificationResult = await verifyMpesaPayment(paymentData)

  const paidAmount = verification.amount
  const providerRef = verification.providerReference

  // ❌ Verification failed
  if (!verification.success) {
    return {
      status: ReconciliationStatus.FAILED,
      paidAmount: paidAmount,
      expectedAmount: expectedAmount,
      providerReference: providerRef,   
      raw: verification.raw,
      failureReason: 'Mpesa verification failed',
    }
  }

  // ⚠️ Amount mismatch
  if (paidAmount !== expectedAmount) {
    return {
      status: ReconciliationStatus.MISMATCH,
      paidAmount: paidAmount,
      expectedAmount: expectedAmount,
      providerReference: providerRef,     
      raw: verification.raw,
      failureReason: `Expected ${expectedAmount}, got ${paidAmount}`,
    }
  }

  // ✅ Fully matched
  return {
    status: ReconciliationStatus.MATCHED,
    paidAmount: paidAmount,
    expectedAmount: expectedAmount,
    providerReference: providerRef,    
    raw: verification.raw,
  }
}
