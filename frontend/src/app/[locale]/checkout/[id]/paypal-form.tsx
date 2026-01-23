/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js'
import { useToast } from '@/src/hooks/client/use-toast'
import {  createPayPalOrder } from '@/src/lib/actions/paypalActions'
import { useRouter } from 'next/navigation'
import { approvePayPalOrder } from '@/src/lib/payments/paypal/paypal-approve'

export default function PaypalForm({
  orderId,
  paypalClientId,
}: {
  orderId: string
  paypalClientId: string
}) {
  const { toast } = useToast()
  const router = useRouter()

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    if (isPending) return <p className="text-sm text-muted-foreground">Loading PayPal...</p>
    if (isRejected) return <p className="text-sm text-red-500">Error loading PayPal.</p>
    return null
  }

  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(orderId)
    if (!res.success) {
      toast({ description: res.message, variant: 'destructive' })
      return ''
    }
    return res.data
  }

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    // 1️⃣ Approve the PayPal order using your existing action
    const res = await approvePayPalOrder(orderId, data)
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' })

    if (!res.success) return

    try {
      // 2️⃣ Call your complete-payment API to verify & mark order as paid
      const verifyRes = await fetch('/api/orders/complete-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentMethod: 'PayPal',
          paymentData: { orderID: data.orderID },
        }),
      })
      const verifyData = await verifyRes.json()

      if (verifyData.success) {
        toast({ description: '✅ Payment verified and order completed!' })
        router.push(`/checkout/${orderId}/success`)
      } else {
        toast({ description: `❌ Payment verification failed: ${verifyData.error}`, variant: 'destructive' })
      }
    } catch (err: any) {
      toast({ description: `❌ Error completing payment: ${err.message}`, variant: 'destructive' })
    }
  }

  return (
    <PayPalScriptProvider options={{ clientId: paypalClientId }}>
      <PrintLoadingState />
      <PayPalButtons
        createOrder={handleCreatePayPalOrder}
        onApprove={handleApprovePayPalOrder}
      />
    </PayPalScriptProvider>
  )
}
