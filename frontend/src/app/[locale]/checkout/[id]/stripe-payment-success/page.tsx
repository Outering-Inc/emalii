import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import Stripe from 'stripe'

import { Button } from '@/src/components/ui/button'
import { getOrderById } from '@/src/lib/actions/orderActions'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

export default async function SuccessPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ payment_intent: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { id } = params

  // 1️⃣ Fetch order
  const order = await getOrderById(id)
  if (!order) notFound()

  // 2️⃣ Retrieve Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.retrieve(
    searchParams.payment_intent
  )

  // 3️⃣ Ensure the payment intent belongs to this order
  if (
    !paymentIntent.metadata.orderId ||
    paymentIntent.metadata.orderId !== order._id.toString()
  ) {
    return notFound()
  }

  // 4️⃣ Check if payment was successful
  const isSuccess = paymentIntent.status === 'succeeded'

  // 5️⃣ If not, redirect to checkout
  if (!isSuccess) return redirect(`/checkout/${id}`)

  // 6️⃣ Optional: mark order as paid & deduct inventory
  // ✅ This should already be done via the webhook, so only show page

  return (
    <div className='max-w-4xl w-full mx-auto space-y-8'>
      <div className='flex flex-col gap-6 items-center'>
        <h1 className='font-bold text-2xl lg:text-3xl'>
          Thanks for your purchase
        </h1>
        <div>We are now processing your order.</div>
        <Button asChild>
          <Link href={`/account/orders/${id}`}>View order</Link>
        </Button>
      </div>
    </div>
  )
}
