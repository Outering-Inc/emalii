'use client'

import { useEffect, useRef, useState } from 'react'
import { OrderStatus, TERMINAL_STATUSES } from '@/src/lib/orders/order-status'

type StatusResponse = {
  isPaid: boolean
  status: OrderStatus
  paidAt?: string | null
  paymentMethod?: 'MPESA' | 'STRIPE' | 'PAYPAL' | 'CASH'
}

type Options = {
  pollInterval?: number
  enabled?: boolean
}

export function useOrderPaymentPollingStatus(
  orderId: string,
  options: Options = {}
) {
  const { pollInterval = 3000, enabled = true } = options
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [isPaid, setIsPaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !orderId) return
    let cancelled = false

    const stopPolling = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`, {
          cache: 'no-store',
        })

        if (res.status === 410) {
          setStatus('EXPIRED')
          setLoading(false)
          stopPolling()
          return
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data: StatusResponse = await res.json()
        if (cancelled) return

        setStatus(data.status)
        setIsPaid(data.isPaid)
        setLoading(false)

        if (TERMINAL_STATUSES.includes(data.status)) {
          stopPolling()
        }
      } catch (err) {
        if (cancelled) return
        setStatus('ERROR')
        setError(err instanceof Error ? err.message : 'UNKNOWN_ERROR')
      }
    }

    fetchStatus()
    timerRef.current = setInterval(fetchStatus, pollInterval)

    return () => {
      cancelled = true
      stopPolling()
    }
  }, [orderId, enabled, pollInterval])

  return {
    loading,
    status,
    isPaid,
    error,
    isTerminal: TERMINAL_STATUSES.includes(status),
  }
}
