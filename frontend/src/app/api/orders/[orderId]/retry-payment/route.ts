/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

import { auth } from '@/src/lib/auth'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

import { retryOrderPayment } from '@/src/lib/actions/paymentRetryAction'
import { canRetryOrder } from '@/src/lib/orders/order-utils'

import { rateLimit } from '@/src/lib/security/rateLimiter'
import { withIdempotency } from '@/src/lib/security/idempotency'
import { PaymentState } from '@/src/lib/payments/state-machine/paymentState'

/**
 * Production-ready Retry Payment API
 * Implements:
 *  - Redis rate limiting
 *  - Redis idempotency keys
 *  - Atomic DB lock for payment state
 *  - Payment orchestrator (MPESA/Stripe/PayPal/Cash)
 *  - Prevents double payment (Amazon/Jumia style)
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> } // ✅ FIXED
) {
  await connectToDatabase()

  try {
    const { orderId } = await context.params // ✅ FIXED

    /* ================= AUTH ================= */
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json({ message: 'Invalid order id' }, { status: 400 })
    }

    /* ================= RATE LIMIT ================= */
    const rateKey = `retry:${session.user.id}:${orderId}`
    const rl = await rateLimit(rateKey)

    if (!rl.allowed) {
      return NextResponse.json(
        { message: 'Too many retry attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': rl.retryAfter?.toString() ?? '60' } }
      )
    }

    /* ================= FETCH ORDER ================= */
    const order = await OrderModel.findById(orderId)
    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 })
    }

    /* ================= OWNERSHIP ================= */
    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    /* ================= RETRY RULES ================= */
    if (!canRetryOrder(order)) {
      return NextResponse.json({ message: 'Retry window expired' }, { status: 410 })
    }

    /* ================= IDEMPOTENCY ================= */
    const idempotencyKey =
      req.headers.get('Idempotency-Key') ?? `retry:${orderId}:${session.user.id}`

    const result = await withIdempotency(idempotencyKey, async () => {
      const lockedOrder = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          isPaid: false,
          paymentState: { $ne: PaymentState.PROCESSING },
        },
        {
          $set: { paymentState: PaymentState.PROCESSING },
        },
        { new: true }
      )

      if (!lockedOrder) {
        return { success: false, message: 'Payment already processing' }
      }

      return retryOrderPayment(orderId)
    })

    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (err: any) {
    console.error('[RetryPayment]', err)
    return NextResponse.json(
      { message: err.message ?? 'Retry failed' },
      { status: 500 }
    )
  }
}
