'use client'

import { FormEvent, useEffect, useState } from 'react'

import { useMpesa } from '@/src/hooks/mpesa/useMpesa'
import { useMpesaSocketStatus } from '@/src/hooks/mpesa/useMpesaSocketStatus'
import { useMpesaPollingStatus } from '@/src/hooks/mpesa/useMpesaPollingStatus'
import { useMpesaOnlineStatus } from '@/src/hooks/mpesa/useMpesaOnlineStatus'
import { useRestoreMpesaIntent } from '@/src/hooks/mpesa/useRestoreMpesaIntent'

import { MpesaPayButton } from '@/src/components/shared/common/mpesaButton'

const SOFT_TIMEOUT = 40 // seconds

export default function MpesaForm({
  priceInCents,
  orderId,
}: {
  priceInCents: number
  orderId: string
}) {
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [hasRestored, setHasRestored] = useState(false)

  // 🔑 Explicit payment lifecycle
  const [stkInitiated, setStkInitiated] = useState(false)
  const [stkSentAt, setStkSentAt] = useState<number | null>(null)

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
   * 🔁 Restore pending intent (ONLY if STK was already sent)
   */
  useRestoreMpesaIntent(
    (tx) => {
      if (!stkInitiated && tx && !hasRestored) {
        setTransaction(tx)
        setStkInitiated(true)
        setStkSentAt(Date.now())
      }
    },
    setHasRestored
  )

  /**
   * 🔔 Socket status
   */
  const socketStatus = useMpesaSocketStatus(
    transaction?.checkoutRequestId
  )

  /**
   * 🧭 Polling fallback
   */
  const pollingStatus = useMpesaPollingStatus(
    transaction?.checkoutRequestId,
    socketStatus === 'PENDING'
  )

  /**
   * 🧠 Final status resolution
   */
  const finalStatus =
    socketStatus !== 'PENDING'
      ? socketStatus
      : pollingStatus

  /**
   * ⏱ Time since STK sent
   */
  const elapsed =
    stkSentAt
      ? Math.floor((Date.now() - stkSentAt) / 1000)
      : 0

  /**
   * 🚀 User-triggered STK push
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!online) {
      setMessage('📡 No internet connection')
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
    setStkInitiated(true)
    setStkSentAt(Date.now())

    await initiateStkPush(
      phone,
      priceInCents / 100,
      orderId
    )
  }

  /**
   * 🎯 Payment resolution
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
      setStkInitiated(false)
      setStkSentAt(null)
    }
  }, [finalStatus, setSuccess])

  /**
   * 🧠 Dynamic status message
   */
  useEffect(() => {
    if (!stkInitiated) return

    if (elapsed < 10) {
      setMessage('📱 Sending M-Pesa prompt…')
    } else if (elapsed < SOFT_TIMEOUT) {
      setMessage('⏳ Waiting for confirmation…')
    }
  }, [elapsed, stkInitiated])

  const isPending =
    loading || (stkInitiated && finalStatus === 'PENDING')

  const showRetryOptions =
    stkInitiated &&
    finalStatus === 'PENDING' &&
    elapsed > SOFT_TIMEOUT

  const secondsLeft = cooldownUntil
    ? Math.max(
        0,
        Math.ceil((cooldownUntil - Date.now()) / 1000)
      )
    : 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">
        M-Pesa Checkout
      </h2>

      {message && <div>{message}</div>}

      {!online && (
        <p className="text-sm text-orange-600">
          Offline — payment will sync automatically
        </p>
      )}

      {/* 📞 Phone input */}
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="2547XXXXXXXX"
        disabled={isPending || success}
        className="w-full p-2 border rounded"
      />

      {/* 💳 Pay button */}
      <MpesaPayButton
        loading={isPending || !canRetry}
        priceInCents={priceInCents}
      />

      {/* ⏳ Cooldown */}
      {!canRetry && (
        <p className="text-sm text-gray-500">
          Retry available in {secondsLeft}s
        </p>
      )}

      {/* 🔄 Retry UX */}
      {showRetryOptions && (
        <div className="space-y-2 border rounded p-3">
          <p className="text-sm text-orange-600">
            Didn’t receive the M-Pesa prompt?
          </p>

          <button
            type="button"
            onClick={() => {
              setStkInitiated(false)
              setStkSentAt(null)
            }}
            className="text-sm underline"
          >
            Edit phone number
          </button>

          <button
            type="submit"
            disabled={!canRetry}
            className="w-full border rounded p-2"
          >
            Retry STK Push
          </button>
        </div>
      )}
    </form>
  )
}