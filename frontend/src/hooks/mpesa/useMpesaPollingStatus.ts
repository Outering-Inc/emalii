'use client'

import { useEffect, useState } from 'react'

export function useMpesaPollingStatus(
  checkoutRequestId?: string,
  enabled = true
) {
  const [status, setStatus] =
    useState<'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED'>('PENDING')

  useEffect(() => {
    if (!checkoutRequestId || !enabled) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/orders/${checkoutRequestId}/status`
        )
        const json = await res.json()

        // ✅ handle TTL expired
        if (json.expired) {
          setStatus('FAILED') // treat expired as failed for UI purposes
          clearInterval(interval)
          return
        }

        // ✅ handle both shapes
        const resolvedStatus =
          json.mpesaPaymentStatus ?? json.data?.status

        if (
          resolvedStatus === 'SUCCESS' ||
          resolvedStatus === 'FAILED'
        ) {
          setStatus(resolvedStatus)
          clearInterval(interval)
        }
      } catch {
        // silent retry
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [checkoutRequestId, enabled])

  return status
}
