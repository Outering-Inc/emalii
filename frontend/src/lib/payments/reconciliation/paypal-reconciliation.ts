/* eslint-disable @typescript-eslint/no-explicit-any */

import { ReconciliationResult, ReconciliationStatus } from './type'
import { verifyPayPalPayment } from '../paypal/payment-verification'


export async function paypalReconciliation(
  paymentData: any,
  expectedAmount: number
): Promise<ReconciliationResult> {
  const verified = await verifyPayPalPayment(paymentData)

  const capture = paymentData?.purchaseUnits?.[0]?.payments?.captures?.[0]
  const paidAmount = Number(capture?.amount?.value)

  if (!verified) {
    return {
      status: ReconciliationStatus.FAILED,
      providerStatus: capture?.status,
      providerReference: capture?.id,
      paidAmount,
      expectedAmount,
      failureReason: 'PayPal verification failed',
      raw: paymentData,
      reconciledAt: new Date(),
    }
  }

  if (paidAmount !== expectedAmount) {
    return {
      status: ReconciliationStatus.MISMATCH,
      providerStatus: capture?.status,
      providerReference: capture?.id,
      paidAmount,
      expectedAmount,
      failureReason: `Expected ${expectedAmount}, got ${paidAmount}`,
      raw: paymentData,
      reconciledAt: new Date(),
    }
  }

  return {
    status: ReconciliationStatus.MATCHED,
    providerStatus: capture?.status,
    providerReference: capture?.id,
    paidAmount,
    expectedAmount,
    raw: paymentData,
    reconciledAt: new Date(),
  }
}
