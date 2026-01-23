/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
  Elements,
} from '@stripe/react-stripe-js'
import { FormEvent, useState, useEffect } from 'react'

import { Button } from '@/src/components/ui/button'
import ProductPrice from '@/src/components/shared/product/product-price'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { createStripePayment } from '@/src/lib/actions/stripeActions'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function StripeCheckoutForm({ priceInCents, orderId }: { priceInCents: number; orderId: string }) {
  const { setting: { site } } = useSettingStore()

  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const [email, setEmail] = useState<string>()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(undefined)

    if (!stripe || !elements || !email) return

    setIsLoading(true)

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${site.url}/checkout/${orderId}/stripe-payment-success`,
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

      {/* ✅ Do NOT pass clientSecret here */}
      <PaymentElement />

      <div>
        {/* ✅ Fix null | undefined issue */}
        <LinkAuthenticationElement onChange={(e) => setEmail(e.value?.email ?? undefined)} />
      </div>

      <Button
        className='w-full'
        size='lg'
        disabled={!stripe || !elements || isLoading || !email}
      >
        {isLoading ? (
          'Purchasing...'
        ) : (
          <div>
            Purchase - <ProductPrice price={priceInCents / 100} plain />
          </div>
        )}
      </Button>
    </form>
  )
}

export default function StripeFormWrapper({ priceInCents, orderId }: { priceInCents: number; orderId: string }) {
  const [clientSecret, setClientSecret] = useState<string>()

  // Fetch clientSecret from server
  useEffect(() => {
    async function initPayment() {
      try {
        const res = await createStripePayment(orderId)
        if (res.success && res.data) {
          setClientSecret(res.data) // ✅ ensure this is string | undefined
        }
      } catch (err: any) {
        console.error(err)
      }
    }
    initPayment()
  }, [orderId])

  if (!clientSecret) return <div>Loading payment...</div>

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutForm priceInCents={priceInCents} orderId={orderId} />
    </Elements>
  )
}
