'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Watch an order silently in the background and redirect
 * if the payment is resolved. Uses the new GET `/api/orders/status`
 * endpoint with `checkoutRequestId`.
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
        // ✅ Use query param style to match new endpoint
        const res = await fetch(
          `/api/orders/status?checkoutRequestId=${orderId}`
        )
        if (!res.ok) return

        const data = await res.json()

        if (!cancelled && data.status === 'SUCCESS') {
          localStorage.removeItem('mpesa:pending')
          router.replace(
            `/checkout/${orderId}/mpesa-payment-success`
          )
        }
      } catch {
        // silent fail
      }
    }, 7000) // poll every 7 seconds

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [orderId, enabled, router])
}