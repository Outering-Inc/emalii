/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { MpesaPendingTx, MpesaTransaction } from '@/src/types/mpesa'

export function useMpesa() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [transaction, setTransaction] =
  useState<MpesaTransaction | MpesaPendingTx | null>(null)


  const [cooldownUntil, setCooldownUntil] =
    useState<number | null>(null)

  const canRetry =
    !cooldownUntil || Date.now() > cooldownUntil

  /**
   * 🔑 Initiate STK Push
   * Matches backend response:
   * {
   *   success: true,
   *   data: MpesaTransaction
   * }
   */
  async function initiateStkPush(
    phone: string,
    amount: number,
    orderId: string
  ) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, amount, orderId }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error ?? 'Failed to initiate M-Pesa')
      }

      // ✅ FIX: backend returns `data`, NOT `transaction`
      const tx: MpesaTransaction = json.data

      if (!tx?.checkoutRequestId) {
        throw new Error('Invalid M-Pesa transaction response')
      }

      // ✅ store transaction
      setTransaction(tx)

      // ✅ persist pending intent (restore on refresh)
      localStorage.setItem(
        'mpesa:pending',
        JSON.stringify(tx)
      )

      // 🔒 Safaricom retry rule (30s)
      setCooldownUntil(Date.now() + 30_000)
    } catch (err: any) {
      console.error('[useMpesa] initiateStkPush error:', err)
      setError(err.message || 'Payment failed')
      throw err // allow UI to react
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
    setTransaction, // ✅ required for restore hook

    initiateStkPush,

    cooldownUntil,
    canRetry,
  }
}