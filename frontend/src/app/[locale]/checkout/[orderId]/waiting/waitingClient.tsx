'use client'

import { useOrderPaymentPollingStatus } from "@/src/hooks/payment/useOrderPaymentPollingStatus"

export default function WaitingClient({
  orderId,
}: {
  orderId: string
}) {
  const { loading, status } = useOrderPaymentPollingStatus(orderId)

  if (loading) {
    return <p>Waiting for payment confirmation…</p>
  }

  if (status === 'PENDING') {
    return <p>Please complete payment on your phone…</p>
  }

  if (status === 'ERROR') {
    return <p>Something went wrong. Retrying…</p>
  }

  return null // redirects handled by hook
}
