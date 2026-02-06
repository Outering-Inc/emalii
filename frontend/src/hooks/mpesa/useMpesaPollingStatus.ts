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

        // 🔴 HARD STOP on TTL
        if (res.status === 410) {
          setStatus('FAILED')
          clearInterval(interval)
          return
        }

        const json = await res.json()

        const resolvedStatus =
          json.status ?? json.data?.status

        if (resolvedStatus === 'SUCCESS' || resolvedStatus === 'FAILED') {
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
