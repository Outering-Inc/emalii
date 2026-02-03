'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export function MpesaRecoveryGate({
  orderId,
}: {
  orderId: string
}) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const recover = async () => {
      try {
        const res = await fetch(
          `/api/orders/${orderId}/status`
        )
        const data = await res.json()

        if (data.isPaid) {
          localStorage.removeItem('mpesa:pending')
          router.replace(
            `/checkout/${orderId}/mpesa-payment-success`
          )
          return
        }
      } catch {
        // ignore
      } finally {
        setChecking(false)
      }
    }

    recover()
  }, [orderId, router])

  if (!checking) return null

  return (
    <div className="p-4 text-sm text-gray-600 text-center">
      🔄 Verifying previous M-Pesa payment…
    </div>
  )
}