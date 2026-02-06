/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentLockModel } from '@/src/lib/db/models/paymentLockModel'

export async function acquirePaymentLock(
  orderId: string,
  providerReference: string
): Promise<boolean> {
  try {
    await PaymentLockModel.create({
      orderId,
      providerReference,
    })
    return true // lock acquired
  } catch (err: any) {
    if (err.code === 11000) {
      return false // already processed
    }
    throw err
  }
}
