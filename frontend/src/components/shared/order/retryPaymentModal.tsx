/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/src/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog'
import { toast } from '@/src/hooks/client/use-toast'
import { formatCurrency } from '@/src/lib/utils/utils'

type Props = {
  orderId: string
  totalPrice: number
  paymentMethod: 'MPESA' | 'STRIPE' | 'PAYPAL' | 'CASH'
}

export function RetryPaymentModal({
  orderId,
  totalPrice,
  paymentMethod,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const retryPayment = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/retry-payment`, {
        method: 'POST',
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.message)

      toast({
        title: 'Payment initiated',
        description:
          paymentMethod === 'MPESA'
            ? 'Please complete the STK push on your phone'
            : 'Redirecting to payment provider…',
      })

      setOpen(false)

      // 🔁 Always redirect to status page
      router.push(`/order/${orderId}/processing`)
    } catch (err: any) {
      toast({
        title: 'Payment failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Retry Payment
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Complete your payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span>Total amount</span>
              <span className="font-semibold">
                {formatCurrency(totalPrice)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Payment method</span>
              <span className="font-semibold">{paymentMethod}</span>
            </div>

            {paymentMethod === 'MPESA' && (
              <p className="text-muted-foreground">
                An M-Pesa STK Push will be sent to your phone.
              </p>
            )}

            {paymentMethod === 'STRIPE' && (
              <p className="text-muted-foreground">
                You will be redirected to secure card payment.
              </p>
            )}

            {paymentMethod === 'PAYPAL' && (
              <p className="text-muted-foreground">
                You will be redirected to PayPal.
              </p>
            )}

            {paymentMethod === 'CASH' && (
              <p className="text-muted-foreground">
                Cash on Delivery does not require online payment.
              </p>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={retryPayment} disabled={loading}>
                {loading ? 'Processing…' : 'Confirm payment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
