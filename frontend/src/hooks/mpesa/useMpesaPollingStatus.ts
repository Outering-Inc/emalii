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
        const data = await res.json()

        if (data.status && data.status !== 'PENDING') {
          setStatus(data.status)
          clearInterval(interval)
        }
      } catch {
        // silent retry
      }
    }, 5000) // slower, safer

    return () => clearInterval(interval)
  }, [checkoutRequestId, enabled])

  return status
}