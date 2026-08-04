/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js'
import { useToast } from '@/src/hooks/client/use-toast'
import { createPayPalOrder } from '@/src/lib/actions/paypalActions'
import { approvePayPalOrder } from '@/src/lib/payments/paypal/paypal-approve'
import { useOrderPaymentPollingStatus } from '@/src/hooks/payment/useOrderPaymentPollingStatus'
import { useOrderPaymentSocketStatus } from '@/src/hooks/payment/useOrderPaymentSocketStatus'


export default function PaypalCheckoutForm({
  orderId,
  paypalClientId,
}: {
  orderId: string
  paypalClientId: string
}) {
  const { toast } = useToast()
  const router = useRouter()

  // ✅ Socket primary
  const { status: socketStatus } = useOrderPaymentSocketStatus(orderId)

  // ✅ Polling fallback
  const { status: pollingStatus } = useOrderPaymentPollingStatus(orderId)

  const currentStatus = socketStatus || pollingStatus

  // 🔄 Redirect user based on real-time status
  useEffect(() => {
    if (currentStatus === 'SUCCESS') router.replace(`/checkout/${orderId}/success`)
    if (currentStatus === 'FAILED') router.replace(`/checkout/${orderId}/result`)
  }, [currentStatus, router, orderId])

  // -----------------------------
  // PayPal loading state component
  // -----------------------------
  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer()
    if (isPending) return <p className="text-sm text-muted-foreground">Loading PayPal...</p>
    if (isRejected) return <p className="text-sm text-red-500">Error loading PayPal.</p>
    return null
  }

  // -----------------------------
  // Create PayPal order
  // -----------------------------
  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(orderId)
    if (!res.success) {
      toast({ description: res.message, variant: 'destructive' })
      return ''
    }
    return res.data
  }

  // -----------------------------
  // Approve PayPal order
  // -----------------------------
  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    // 1️⃣ Approve the PayPal order using your existing backend logic
    const res = await approvePayPalOrder(orderId, data)
    toast({ description: res.message, variant: res.success ? 'default' : 'destructive' })

    if (!res.success) return

    try {
      // 2️⃣ Call your existing complete-payment API (like Stripe)
      const verifyRes = await fetch('/api/orders/processing', {
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
