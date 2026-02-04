/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'

interface MpesaPendingTx {
  checkoutRequestId: string
  orderId: string
  amount?: number
  [key: string]: any
}

export function useRestoreMpesaIntent(
  setTransaction: (tx: MpesaPendingTx) => void
) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx: MpesaPendingTx = JSON.parse(saved)

      // Only restore if it has the minimal required fields
      if (tx.checkoutRequestId && tx.orderId) {
        setTransaction({
          checkoutRequestId: tx.checkoutRequestId,
          orderId: tx.orderId,
          amount: tx.amount,
        })
      } else {
        localStorage.removeItem('mpesa:pending') // invalid data
      }
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction])
}