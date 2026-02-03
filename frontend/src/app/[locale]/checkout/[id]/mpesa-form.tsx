/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { FormEvent, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { useMpesa } from '@/src/hooks/mpesa/useMpesa'
import { useMpesaSocketStatus } from '@/src/hooks/mpesa/useMpesaSocketStatus'
import { useMpesaPollingStatus } from '@/src/hooks/mpesa/useMpesaPollingStatus'
import { useMpesaOnlineStatus } from '@/src/hooks/mpesa/useMpesaOnlineStatus'
import { useRestoreMpesaIntent } from '@/src/hooks/mpesa/useRestoreMpesaIntent'

import { MpesaPayButton } from '@/src/components/shared/common/mpesaButton'
import { normalizeKenyanPhone } from '@/src/lib/utils/mpesa'

const SOFT_TIMEOUT = 40 // seconds
const RETRY_DELAY_MS = 1500 // 1.5 seconds automatic retry delay

export default function MpesaForm({
  priceInCents,
  orderId,
}: {
  priceInCents: number
  orderId: string
}) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [hasRestored, setHasRestored] = useState(false)
  const [autoRetryTriggered, setAutoRetryTriggered] = useState(false)
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null)
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

  // Restore pending intent
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

  // Socket realtime status
  const socketStatus = useMpesaSocketStatus(transaction?.checkoutRequestId)

  // Polling fallback
  const pollingStatus = useMpesaPollingStatus(
    transaction?.checkoutRequestId,
    socketStatus === 'PENDING'
  )

  // Final resolved status
  const finalStatus =
    socketStatus !== 'PENDING' ? socketStatus : pollingStatus

  // Time since STK push
  const elapsed =
    stkSentAt
      ? Math.floor((Date.now() - stkSentAt) / 1000)
      : 0

  // Trigger STK Push
  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      if (e) e.preventDefault()

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
      setAutoRetryTriggered(false)
      setRetryCountdown(null)

      try {
        const normalizedPhone = normalizeKenyanPhone(phone)

        await initiateStkPush(
          normalizedPhone,
          priceInCents / 100,
          orderId
        )
      } catch (error: any) {
        console.error('STK Push failed:', error)
        setMessage(
          `❌ Failed to send M-Pesa prompt: ${error.message ?? 'Unknown error'}`
        )
        setStkInitiated(false)
        setStkSentAt(null)
      }
    },
    [online, phone, canRetry, initiateStkPush, priceInCents, orderId]
  )

  // Payment resolution
  useEffect(() => {
    if (finalStatus === 'SUCCESS') {
      setSuccess(true)
      localStorage.removeItem('mpesa:pending')
      setAutoRetryTriggered(false)
      setRetryCountdown(null)
      router.push(`/checkout/${orderId}/mpesa-payment-success`)
    }

    if (finalStatus === 'FAILED') {
      setSuccess(false)
      setStkInitiated(false)
      setStkSentAt(null)
      setAutoRetryTriggered(false)
      setRetryCountdown(null)
      router.push(`/checkout/${orderId}/mpesa-payment-failed`)
    }
  }, [finalStatus, setSuccess, orderId, router])

  // Dynamic status messaging + auto retry
  useEffect(() => {
    if (!stkInitiated) return

    if (elapsed < 10) {
      setMessage('📱 Sending M-Pesa prompt…')
    } else if (elapsed < SOFT_TIMEOUT) {
      setMessage('⏳ Waiting for confirmation…')
    } else if (!autoRetryTriggered) {
      setAutoRetryTriggered(true)
      let countdown = Math.floor(RETRY_DELAY_MS / 1000)
      setRetryCountdown(countdown)

      const interval = setInterval(() => {
        countdown -= 1
        setRetryCountdown(countdown)
      }, 1000)

      const timeout = setTimeout(() => {
        clearInterval(interval)
        setRetryCountdown(null)
        if (finalStatus === 'PENDING' && canRetry) {
          handleSubmit()
        }
      }, RETRY_DELAY_MS)

      return () => {
        clearTimeout(timeout)
        clearInterval(interval)
        setRetryCountdown(null)
      }
    }
  }, [elapsed, stkInitiated, autoRetryTriggered, handleSubmit, finalStatus, canRetry])

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

  // Overlay condition
  const isProcessing = stkInitiated && finalStatus === 'PENDING'

  return (
      <div className="relative">
        {/* ✅ MOBILE-FIRST MPESA OVERLAY */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 sm:absolute sm:rounded-lg">
            <div className="bg-white w-[90%] max-w-sm rounded-xl p-6 text-center shadow-xl">
              {/* M-Pesa green spinner */}
              <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />

              <h3 className="text-lg font-semibold text-gray-900">
                Processing M-Pesa Payment
              </h3>

              <p className="mt-2 text-sm text-gray-600">
                Check your phone and enter your M-Pesa PIN.
              </p>

              <p className="mt-3 text-xs text-gray-400">
                Do not close or refresh this page
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">M-Pesa Checkout</h2>

          {message && <p>{message}</p>}

          {retryCountdown !== null && (
            <p className="text-sm text-blue-600">
              ⏳ Retrying STK push in {retryCountdown}s…
            </p>
          )}

          {!online && (
            <p className="text-sm text-orange-600">
              Offline — payment will sync automatically
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
      </div>
    )
  }