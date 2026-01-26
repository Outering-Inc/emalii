import { ReconciliationResult, ReconciliationStatus } from "./type";
export async function cashReconciliation(
  expectedAmount: number
): Promise<ReconciliationResult> {
  return {
    status: ReconciliationStatus.MATCHED,
    providerStatus: 'CASH_PENDING_COLLECTION',
    providerReference: 'COD',
    paidAmount: expectedAmount,
  }
}
