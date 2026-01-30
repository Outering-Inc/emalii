'use client'

import { useEffect, useState } from 'react'

export function useMpesaStatus(checkoutRequestId?: string) {
  const [status, setStatus] =
    useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING')

  useEffect(() => {
    if (!checkoutRequestId) return

    const interval = setInterval(async () => {
      const res = await fetch(
        `/api/mpesa/status?checkoutRequestId=${checkoutRequestId}`
      )

      const data = await res.json()

      if (data.status && data.status !== 'PENDING') {
        setStatus(data.status)
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [checkoutRequestId])

  return status
}