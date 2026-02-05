
'use client'

import { useEffect } from 'react'
import type { MpesaPendingTx } from '@/src/types/mpesa'

export function useRestoreMpesaIntent(
  setTransaction: (tx: MpesaPendingTx | null) => void
) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx: MpesaPendingTx = JSON.parse(saved)

      // ✅ minimal restore validation (unchanged logic)
      if (tx.checkoutRequestId && tx.orderId) {
        setTransaction({
          checkoutRequestId: tx.checkoutRequestId,
          orderId: tx.orderId,
          amount: tx.amount,
        })
      } else {
        localStorage.removeItem('mpesa:pending')
      }
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction])
}
