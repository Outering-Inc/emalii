'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useMpesa } from '@/src/hooks/mpesa/useMpesa'
import { useMpesaStatus } from '@/src/hooks/mpesa/useMpesaStatus'
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
   
    initiateStkPush,
    transaction,
  } = useMpesa()

  const paymentStatus = useMpesaStatus(
    transaction?.checkoutRequestId
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (!phone) {
      setMessage('❌ Enter phone number')
      return
    }

    setMessage('')
    await initiateStkPush(phone, priceInCents / 100, orderId)
  }

  // ✅ Auto detect result
  useEffect(() => {
    if (paymentStatus === 'SUCCESS') {
      setMessage('✅ Payment successful!')
    }

    if (paymentStatus === 'FAILED') {
      setMessage('❌ Payment failed or cancelled')
    }
  }, [paymentStatus])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl">M-Pesa Checkout</h2>

      {message && <div>{message}</div>}

      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="2547XXXXXXXX"
        disabled={loading || success}
        className="w-full p-2 border rounded"
      />

      <MpesaPayButton
        loading={loading || paymentStatus === 'PENDING'}
        priceInCents={priceInCents}
      />

      {success && paymentStatus === 'PENDING' && (
        <p className="text-sm text-gray-500">
          Waiting for payment confirmation…
        </p>
      )}
    </form>
  )
}