/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'

const MPESA_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function useRestoreMpesaIntent(
  setTransaction: (tx: any) => void
) {
  useEffect(() => {
    const raw = localStorage.getItem('mpesa:pending')
    if (!raw) return

    try {
      const saved = JSON.parse(raw)

      // 🧠 Validate shape
      if (
        !saved?.checkoutRequestId ||
        !saved?.orderId ||
        !saved?.createdAt
      ) {
        localStorage.removeItem('mpesa:pending')
        return
      }

      // ⏱ TTL validation
      const age = Date.now() - saved.createdAt
      if (age > MPESA_TTL_MS) {
        console.warn('⚠️ Expired M-Pesa intent discarded')
        localStorage.removeItem('mpesa:pending')
        return
      }

      // ✅ Restore safely (NO auto-trigger)
      setTransaction(saved)
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction])
}