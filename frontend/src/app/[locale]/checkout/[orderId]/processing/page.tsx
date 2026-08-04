'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useOrderPaymentSocketStatus } from '@/src/hooks/payment/useOrderPaymentSocketStatus'
import { useOrderPaymentPollingStatus } from '@/src/hooks/payment/useOrderPaymentPollingStatus'

export default function ProcessingPage() {
  const router = useRouter()
  const { orderId } = useParams<{ orderId: string }>()

  const { isPaid, isTerminal } =
    useOrderPaymentSocketStatus(orderId)

  // ✅ Polling fallback (required in production)
  useOrderPaymentPollingStatus(orderId)

  useEffect(() => {
    // ✅ PAYMENT SUCCESS
    if (isPaid) {
      router.replace(`/checkout/${orderId}/result?status=success`)
      return
    }

    // ❌ PAYMENT FAILED / EXPIRED / CANCELLED
    if (isTerminal && !isPaid) {
      router.replace(`/checkout/${orderId}/result?status=failed`)
    }
  }, [isPaid, isTerminal, orderId, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" />
        <h1 className="text-xl font-medium">
          Processing your payment…
        </h1>
        <p className="text-sm text-gray-500">
          Please do not refresh or close this page
        </p>
      </div>
    </div>
  )
}
