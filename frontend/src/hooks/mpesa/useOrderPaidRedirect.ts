'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useOrderPaidRedirect(orderId: string) {
  const router = useRouter()

  useEffect(() => {
    if (!orderId) return

    const checkPaid = async () => {
      try {
        const res = await fetch(
          `/api/orders/${orderId}/status`
        )

        if (!res.ok) return

        const data = await res.json()

        if (data.isPaid) {
          router.replace(
            `/checkout/${orderId}/mpesa-payment-success`
          )
        }
      } catch {
        // silent
      }
    }

    checkPaid()
  }, [orderId, router])
}