/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { normalizeKenyanPhone } from '@/src/lib/utils/mpesa'

interface MpesaTransaction {
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
    if (loading) return // 🔒 frontend retry suppression

    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      const sanitizedPhone = normalizeKenyanPhone(phone)

      const res = await fetch('/api/mpesa/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: sanitizedPhone,
          amount,
          orderId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Failed to initiate payment')
      }

      if (data.data) {
        setTransaction(data.data)
      }

      setSuccess(true)
      return { success: true }
    } catch (err: any) {
      setError(err.message || 'Payment failed')
      setSuccess(false)
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    success,
    error,
    transaction,
    initiateStkPush,
  }
}
