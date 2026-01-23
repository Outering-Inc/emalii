/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

export async function verifyStripePayment(paymentData: { paymentIntentId: string }): Promise<boolean> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentData.paymentIntentId)

    // PaymentIntent status must be 'succeeded'
    if (paymentIntent.status === 'succeeded') return true

    console.error('Stripe payment not succeeded:', paymentIntent.status)
    return false
  } catch (err: any) {
    console.error('Error verifying Stripe payment:', err.message)
    return false
  }
}
