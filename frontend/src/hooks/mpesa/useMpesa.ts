/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { MpesaTransaction } from '@/src/types/mpesa'

export function useMpesa() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transaction, setTransaction] =
    useState<MpesaTransaction | null>(null)

  const [cooldownUntil, setCooldownUntil] =
    useState<number | null>(null)

  const canRetry =
    !cooldownUntil || Date.now() > cooldownUntil

  async function initiateStkPush(
    phone: string,
    amount: number,
    orderId: string
  ) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/mpesa/stk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, orderId }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setTransaction(data.transaction)

      // 🔒 retry cooldown (30s rule)
      setCooldownUntil(Date.now() + 30_000)

      // 💾 persist pending intent
      localStorage.setItem(
        'mpesa:pending',
        JSON.stringify(data.transaction)
      )
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    success,
    setSuccess,
    error,
    transaction,
    setTransaction, // ✅ REQUIRED for restore
    initiateStkPush,
    cooldownUntil,
    canRetry,
  }
}