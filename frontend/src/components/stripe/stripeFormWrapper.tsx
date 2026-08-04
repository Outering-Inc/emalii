/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { createStripePayment } from '@/src/lib/actions/stripeActions'
import StripeCheckoutForm from '@/src/app/[locale]/checkout/[orderId]/stripe-form'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeFormWrapperProps {
  priceInCents: number
  orderId: string
}

export default function StripeFormWrapper({ priceInCents, orderId }: StripeFormWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>()

  useEffect(() => {
    async function initPayment() {
      try {
        const res = await createStripePayment(orderId)
        if (res.success && res.data) setClientSecret(res.data.checkoutUrl)
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
