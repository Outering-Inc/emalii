/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'


import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/src/components/ui/button'
import { useOrderPaymentSocketStatus } from '@/src/hooks/payment/useOrderPaymentSocketStatus'
import { useOrderPaymentPollingStatus } from '@/src/hooks/payment/useOrderPaymentPollingStatus'

import StripeFormWrapper from '@/src/components/stripe/stripeFormWrapper'
import PaypalCheckoutForm from '../paypal-form'
import MpesaForm from '../mpesa-form'

type Provider = 'STRIPE' | 'PAYPAL' | 'MPESA' | 'CASH'

export default function RetryPaymentClient({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [amountInCents, setAmountInCents] = useState<number | null>(null)
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null)

  const { status: socketStatus } = useOrderPaymentSocketStatus(orderId)
  const { status: pollingStatus } = useOrderPaymentPollingStatus(orderId)
  const currentStatus = socketStatus || pollingStatus

  useEffect(() => {
    if (currentStatus === 'SUCCESS') router.replace(`/checkout/${orderId}/success`)
    if (currentStatus === 'FAILED') router.replace(`/checkout/${orderId}/result`)
  }, [currentStatus, router, orderId])

  useEffect(() => {
    async function initRetry() {
      try {
        const res = await fetch(`/api/orders/${orderId}/retry-payment`, { method: 'POST' })
        const data = await res.json()

        if (!res.ok) {
          setError(data.message || 'Unable to retry payment')
          setLoading(false)
          return
        }

        if (data.provider === 'CASH') {
          router.replace(`/checkout/${orderId}/processing`)
          return
        }

        if (data.provider === 'STRIPE' && data.amountInCents) {
          setProvider('STRIPE')
          setAmountInCents(data.amountInCents)
          setLoading(false)
          return
        }

        if (data.provider === 'PAYPAL') {
          setProvider('PAYPAL')
          setPaypalClientId(data.paypalClientId || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!)
          setLoading(false)
          return
        }

        if (data.provider === 'MPESA') {
          setProvider('MPESA')
          setLoading(false)
          return
        }

        if (data.redirectUrl) {
          router.replace(data.redirectUrl)
          return
        }

        setError('Unsupported payment provider')
        setLoading(false)
      } catch (err: any) {
        setError(err.message ?? 'Payment retry failed')
        setLoading(false)
      }
    }

    initRetry()
  }, [orderId, router])

  if (loading)
    return <div className="flex min-h-[60vh] items-center justify-center">Preparing your payment…</div>

  if (error)
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-xl font-bold text-red-600">Payment Retry Failed</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-6">
          <Button onClick={() => router.back()}>Go back</Button>
        </div>
      </div>
    )

  if (provider === 'STRIPE' && amountInCents)
    return (
      <div className="max-w-xl mx-auto py-8">
        <StripeFormWrapper orderId={orderId} priceInCents={amountInCents} />
      </div>
    )

  if (provider === 'PAYPAL' && paypalClientId)
    return (
      <div className="max-w-xl mx-auto py-8">
        <PaypalCheckoutForm orderId={orderId} paypalClientId={paypalClientId} />
      </div>
    )

  if (provider === 'MPESA')
    return (
      <div className="max-w-xl mx-auto py-8">
        <MpesaForm orderId={orderId} priceInCents={amountInCents!} />
      </div>
    )

  return null
}
