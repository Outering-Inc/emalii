'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useMpesa } from '@/src/hooks/mpesa/useMpesa'
import { useMpesaSocketStatus } from '@/src/hooks/mpesa/useMpesaSocketStatus'
import { useMpesaPollingStatus } from '@/src/hooks/mpesa/useMpesaPollingStatus'
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

  const {
    loading,
    success,
    setSuccess,
    initiateStkPush,
    transaction,
  } = useMpesa()

  const socketStatus = useMpesaSocketStatus(
    transaction?.checkoutRequestId
  )

  const pollingStatus = useMpesaPollingStatus(
    transaction?.checkoutRequestId,
    socketStatus === 'PENDING'
  )

  const finalStatus =
    socketStatus !== 'PENDING' ? socketStatus : pollingStatus

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!phone) {
      setMessage('❌ Enter phone number')
      return
    }

    setMessage('')
    await initiateStkPush(phone, priceInCents / 100, orderId)
  }

  useEffect(() => {
    if (finalStatus === 'SUCCESS') {
      setSuccess(true)
      setMessage('✅ Payment successful!')
    }

    if (finalStatus === 'FAILED') {
      setSuccess(false)
      setMessage('❌ Payment failed. Try again.')
    }
  }, [finalStatus, setSuccess])

  const isPending = loading || finalStatus === 'PENDING'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl">M-Pesa Checkout</h2>

      {message && <div>{message}</div>}

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="2547XXXXXXXX"
        disabled={isPending || success}
        className="w-full p-2 border rounded"
      />

      <MpesaPayButton
        loading={isPending}
        priceInCents={priceInCents}
      />

      {isPending && (
        <p className="text-sm text-gray-500">
          Waiting for payment confirmation…
        </p>
      )}
    </form>
  )
}