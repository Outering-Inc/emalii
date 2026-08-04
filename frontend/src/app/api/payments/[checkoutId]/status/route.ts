'use server'

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { auth } from '@/src/lib/auth'
import { getCheckoutId } from '@/src/lib/utils/utils'


// ⏱ TTL for orders to auto-fail (like abandoned carts)
const STATUS_TTL = 1000 * 60 * 15 // 15 minutes

export async function GET(req: NextRequest) {
  await connectToDatabase()

  try {
    // ================= AUTHENTICATION =================
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ isPaid: false, status: 'UNAUTHORIZED' }, { status: 401 })
    }

    // ================= CHECKOUT ID =================
    const checkoutId = getCheckoutId(req)
    if (!checkoutId || !mongoose.Types.ObjectId.isValid(checkoutId)) {
      return NextResponse.json({ isPaid: false, status: 'INVALID_CHECKOUT_ID' }, { status: 400 })
    }

    // ================= FIND ORDER =================
    const order = await OrderModel.findById(checkoutId)
    if (!order) {
      return NextResponse.json({ isPaid: false, status: 'ORDER_NOT_FOUND' }, { status: 404 })
    }

    // ================= OWNERSHIP CHECK =================
    if (order.user.toString() !== session.user.id) {
      return NextResponse.json({ isPaid: false, status: 'FORBIDDEN' }, { status: 403 })
    }

    // ================= TTL CHECK =================
    const age = Date.now() - order.createdAt.getTime()
    if (!order.isPaid && age > STATUS_TTL) {
      return NextResponse.json({ isPaid: false, status: 'EXPIRED' }, { status: 410 })
    }

    // ================= RESPONSE =================
    // Normalize payment state for all gateways
    const paymentInfo = {
      isPaid: order.isPaid,
      status: order.isPaid ? 'SUCCESS' : order.paymentState ?? 'PENDING',
      paidAt: order.paidAt?.toISOString() ?? null,
      mpesaTransactionId: order.paymentReference?.provider === 'MPESA' ? order.paymentReference.transactionId : null,
      stripeTransactionId: order.paymentReference?.provider === 'STRIPE' ? order.paymentReference.transactionId : null,
      paypalTransactionId: order.paymentReference?.provider === 'PAYPAL' ? order.paymentReference.transactionId : null,
      paymentMethod: order.paymentMethod ?? null,
    }

    return NextResponse.json(paymentInfo, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  } catch (err) {
    console.error('[Order Status] Error:', err)
    return NextResponse.json({ isPaid: false, status: 'ERROR' }, { status: 500 })
  }
}
