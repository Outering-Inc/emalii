'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Watch an order silently in the background and redirect
 * if the payment is resolved.
 *
 * Uses existing GET `/api/mpesa/status`
 * (DO NOT change backend logic)
 *
 * @param orderId Order ID to watch
 * @param enabled Only start watching if true
 */
export function useSilentOrderWatcher(orderId: string, enabled: boolean) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled || !orderId) return

    let cancelled = false

    const interval = setInterval(async () => {
      try {
        // ✅ FIX: point to existing backend endpoint
        const res = await fetch(
          `/api/mpesa/status?checkoutRequestId=${orderId}`
        )

        if (!res.ok) return

        const data = await res.json()

        // ✅ SAME logic as before
        if (!cancelled && data.status === 'SUCCESS') {
          localStorage.removeItem('mpesa:pending')
          router.replace(
            `/checkout/${orderId}/mpesa-payment-success`
          )
        }

        if (!cancelled && data.status === 'FAILED') {
          localStorage.removeItem('mpesa:pending')
          router.replace(
            `/checkout/${orderId}/mpesa-payment-failed`
          )
        }
      } catch {
        // silent fail (unchanged)
      }
    }, 7000) // poll every 7 seconds (unchanged)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId, enabled, router])
}