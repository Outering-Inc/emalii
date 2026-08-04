'use client'

import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { useOrderPaymentPollingStatus } from '@/src/hooks/payment/useOrderPaymentPollingStatus'
import {
  canRetryPayment,
  isSuccessful,
  isFailed,
} from '@/src/lib/orders/order-status'

export default function OrderResultClient({
  orderId,
}: {
  orderId: string
}) {
  const { status, loading, error } =
    useOrderPaymentPollingStatus(orderId)

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p>Loading order status…</p>
      </div>
    )
  }

  /* -----------------------------------------
   ✅ SUCCESS
  ------------------------------------------ */
  if (isSuccessful(status)) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-green-600">
          Payment Successful 🎉
        </h1>

        <p className="mt-2 text-muted-foreground">
          Your order has been confirmed.
        </p>

        <div className="mt-6">
          <Button asChild>
            <Link href={`/account/orders/${orderId}`}>
              View your order
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  /* -----------------------------------------
   ❌ FAILED / EXPIRED / ERROR
  ------------------------------------------ */
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold text-red-600">
        {isFailed(status)
          ? 'Payment Failed'
          : 'Payment Not Completed'}
      </h1>

      <p className="mt-2 text-muted-foreground">
        {error
          ? 'Something went wrong while confirming your payment.'
          : isFailed(status)
          ? 'Your payment was declined or cancelled.'
          : 'We couldn’t confirm your payment in time.'}
      </p>

      <div className="mt-6 flex justify-center gap-4">
        {canRetryPayment(status) && (
          <Button asChild>
            <Link href={`/checkout/${orderId}`}>
              Retry payment
            </Link>
          </Button>
        )}

        <Button asChild variant="outline">
          <Link href="/account/orders">
            Go to orders
          </Link>
        </Button>
      </div>
    </div>
  )
}
