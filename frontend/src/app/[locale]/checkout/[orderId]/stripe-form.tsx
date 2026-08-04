'use client'

import {
  PaymentElement,
  useElements,
  useStripe,
  LinkAuthenticationElement,
} from '@stripe/react-stripe-js'
import { FormEvent, useState, useEffect } from 'react'
import { Button } from '@/src/components/ui/button'
import ProductPrice from '@/src/components/shared/product/product-price'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { useRouter } from 'next/navigation'

import { useOrderPaymentPollingStatus } from '@/src/hooks/payment/useOrderPaymentPollingStatus'
import { useOrderPaymentSocketStatus } from '@/src/hooks/payment/useOrderPaymentSocketStatus'

export default function StripeCheckoutForm({ priceInCents, orderId }: { priceInCents: number; orderId: string }) {
  const { setting: { site } } = useSettingStore()
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [email, setEmail] = useState<string>()

  // ✅ Socket primary
  const { status: socketStatus } = useOrderPaymentSocketStatus(orderId)

  // ✅ Polling fallback
  const { status: pollingStatus } = useOrderPaymentPollingStatus(orderId)

  const currentStatus = socketStatus || pollingStatus

  useEffect(() => {
    if (currentStatus === 'SUCCESS') router.replace(`/checkout/${orderId}/success`)
    if (currentStatus === 'FAILED') router.replace(`/checkout/${orderId}/result`)
  }, [currentStatus, router, orderId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(undefined)
    if (!stripe || !elements || !email) return
    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${site.url}/checkout/${orderId}/processing`,
        receipt_email: email,
      },
    })

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('An unknown error occurred')
      }
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='text-xl'>Stripe Checkout</div>
      {errorMessage && <div className='text-destructive'>{errorMessage}</div>}
      <PaymentElement />
      <div>
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value?.email ?? undefined)} />
      </div>
      <Button className='w-full' size='lg' disabled={!stripe || !elements || !isLoading || !email}>
        {isLoading ? 'Purchasing...' : <div>Purchase - <ProductPrice price={priceInCents / 100} plain /></div>}
      </Button>
    </form>
  )
}
