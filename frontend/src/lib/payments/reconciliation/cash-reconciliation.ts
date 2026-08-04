import { ReconciliationResult, ReconciliationStatus } from './type'

export async function cashReconciliation(
  expectedAmount: number
): Promise<ReconciliationResult> {
  return {
    // Cash-on-delivery is trusted at order time
    status: ReconciliationStatus.MATCHED,

    // No real payment provider – internal semantic status
    providerStatus: 'CASH_PENDING_COLLECTION',

    // Static reference for COD
    providerReference: 'COD',

    // Amount expected to be collected on delivery
    paidAmount: expectedAmount,

    // Explicit audit metadata
    raw: {
      method: 'CASH_ON_DELIVERY',
      collectionStatus: 'PENDING',
    },

    reconciledAt: new Date(),
  }
}
