'use client'

import { useEffect, useState } from 'react'

export function useMpesaPollingStatus(
  checkoutRequestId?: string,
  enabled = true
) {
  const [status, setStatus] =
    useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING')

  useEffect(() => {
    if (!checkoutRequestId || !enabled) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/mpesa/status?checkoutRequestId=${checkoutRequestId}`
        )
        const json = await res.json()

        // ✅ handle both shapes
        const resolvedStatus =
          json.status ?? json.data?.status

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