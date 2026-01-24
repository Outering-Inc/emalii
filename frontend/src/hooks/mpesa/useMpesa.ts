/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { sanitizeKenyanPhone } from '@/src/lib/utils/mpesa'
import { useState } from 'react'
//import { sanitizeKenyanPhone } from '@/src/lib/utils/phone'

interface MpesaTransaction {
  _id: string
  phone: string
  amount: number
  mpesaReceiptNumber: string
  transactionDate: string
  resultCode: number
  status: string
  merchantRequestId: string
  checkoutRequestId: string
  user: string
  orderId: string
}

export const useMpesa = () => {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transaction, setTransaction] = useState<MpesaTransaction | null>(null)

  const initiateStkPush = async (
    phone: string,
    amount: number,
    orderId: string
  ) => {
    setLoading(true)
    setSuccess(false)
    setError(null)

    try {
      // ✅ SANITIZE (reused util)
      const sanitizedPhone = sanitizeKenyanPhone(phone)

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

      if (data.transaction) {
        setTransaction(data.transaction)
      }

      setSuccess(true)
      return { success: true, data }
    } catch (err: any) {
      console.error('STK Push Error:', err)
      setError(err.message || 'Payment failed')
      return { success: false }
    } finally {
      setLoading(false)
    }
  }

  return { loading, success, error, initiateStkPush, transaction }
}
