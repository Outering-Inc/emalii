import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
})

export async function verifyStripePayment(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  if (!paymentIntentId) {
    throw new Error('Missing paymentIntentId')
  }

  return await stripe.paymentIntents.retrieve(paymentIntentId)
}
