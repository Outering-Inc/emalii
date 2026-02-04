'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useSilentOrderWatcher(
  orderId: string,
  enabled: boolean
) {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`)
        if (!res.ok) return

        const data = await res.json()
        if (data.isPaid) {
          clearInterval(interval)
          localStorage.removeItem('mpesa:pending')
          router.replace(
            `/checkout/${orderId}/mpesa-payment-success`
          )
        }
      } catch {
        // silent retry
      }
    }, 7000)

    return () => clearInterval(interval)
  }, [orderId, enabled, router])
}