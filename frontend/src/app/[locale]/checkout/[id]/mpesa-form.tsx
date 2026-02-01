'use client'

import { FormEvent, useEffect, useState } from 'react'

import { useMpesa } from '@/src/hooks/mpesa/useMpesa'
import { useMpesaSocketStatus } from '@/src/hooks/mpesa/useMpesaSocketStatus'
import { useMpesaPollingStatus } from '@/src/hooks/mpesa/useMpesaPollingStatus'
import { useMpesaOnlineStatus } from '@/src/hooks/mpesa/useMpesaOnlineStatus'
import { useRestoreMpesaIntent } from '@/src/hooks/mpesa/useRestoreMpesaIntent'

import { MpesaPayButton } from '@/src/components/shared/common/mpesaButton'

export default function MpesaForm({
  priceInCents,
  orderId,
}: {
  priceInCents: number
  orderId: string
}) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [hasRestored, setHasRestored] = useState(false) // ✅ REQUIRED

  const online = useMpesaOnlineStatus()

  const {
    loading,
    success,
    setSuccess,
    initiateStkPush,
    transaction,
    setTransaction,
    cooldownUntil,
    canRetry,
  } = useMpesa()

  /**
   * 🔁 Restore pending intent ONLY ONCE
   * 🧠 Only if user has NOT typed phone
   */
  useRestoreMpesaIntent(
    (tx) => {
      if (!phone && tx && !hasRestored) {
        setTransaction(tx)
      }
    },
    setHasRestored
  )

  /**
   * 🔔 Socket (primary)
   */
  const socketStatus = useMpesaSocketStatus(
    transaction?.checkoutRequestId || undefined
  )

  /**
   * 🧭 Polling (fallback)
   */
  const pollingStatus = useMpesaPollingStatus(
    transaction?.checkoutRequestId || undefined,
    socketStatus === 'PENDING'
  )

  /**
   * 🧠 Final resolved status
   */
  const finalStatus =
    socketStatus !== 'PENDING'
      ? socketStatus
      : pollingStatus

  /**
   * 🚀 User-triggered STK push ONLY
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!online) {
      setMessage('📡 No internet. Waiting to reconnect…')
      return
    }

    if (!phone) {
      setMessage('❌ Enter phone number')
      return
    }

    if (!canRetry) {
      setMessage('⏳ Please wait before retrying')
      return
    }

    setMessage('')
    await initiateStkPush(
      phone,
      priceInCents / 100,
      orderId
    )
  }

  /**
   * 🎯 Resolve payment result
   */
  useEffect(() => {
    if (finalStatus === 'SUCCESS') {
      setSuccess(true)
      setMessage('✅ Payment successful!')
      localStorage.removeItem('mpesa:pending')
    }

    if (finalStatus === 'FAILED') {
      setSuccess(false)
      setMessage('❌ Payment failed. You can retry.')
    }
  }, [finalStatus, setSuccess])

  const isPending = loading || finalStatus === 'PENDING'

  const secondsLeft = cooldownUntil
    ? Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
    : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">
        M-Pesa Checkout
      </h2>

      {message && <div>{message}</div>}

      {!online && (
        <p className="text-sm text-orange-600">
          Offline — payment status will sync automatically
        </p>
      )}

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="2547XXXXXXXX"
        disabled={isPending || success}
        className="w-full p-2 border rounded"
      />

      <MpesaPayButton
        loading={isPending || !canRetry}
        priceInCents={priceInCents}
      />

      {!canRetry && (
        <p className="text-sm text-gray-500">
          Retry available in {secondsLeft}s
        </p>
      )}

      {isPending && (
        <p className="text-sm text-gray-500">
          Waiting for payment confirmation…
        </p>
      )}
    </form>
  )
}