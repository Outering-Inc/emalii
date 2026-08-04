'use client'

import Link from 'next/link'
import { Button } from '@/src/components/ui/button'

export default function SuccessClient({
  orderId,
}: {
  orderId: string
}) {
  return (
    <div className="max-w-xl mx-auto py-16 text-center">
      <h1 className="text-2xl font-bold text-green-600">
        Payment Successful 🎉
      </h1>

      <p className="mt-2 text-muted-foreground">
        Your payment has been confirmed and your order is being processed.
      </p>

      <div className="mt-6 flex justify-center gap-4">
        <Button asChild>
          <Link href={`/account/orders/${orderId}`}>
            View Order
          </Link>
        </Button>

        <Button asChild variant="outline">
          <Link href="/shop">
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  )
}
