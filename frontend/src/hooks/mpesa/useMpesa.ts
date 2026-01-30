/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useState } from 'react'
import { normalizeKenyanPhone } from '@/src/lib/utils/mpesa'

export interface MpesaTransaction {
  _id: string
  phone: string
  amount: number
  status: string
  checkoutRequestId: string
}

export const useMpesa = () => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] =
    useState<MpesaTransaction | null>(null)

  const initiateStkPush = async (
    phone: string,
    amount: number,
    orderId: string
  ) => {
    if (loading) return

    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const sanitizedPhone = normalizeKenyanPhone(phone)

      const res = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sanitizedPhone, amount, orderId }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to initiate payment')

      if (data.data) setTransaction(data.data)
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
    initiateStkPush,
  }
}