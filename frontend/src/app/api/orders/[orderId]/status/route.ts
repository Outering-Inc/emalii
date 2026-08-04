/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'

import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { auth } from '@/src/lib/auth'
import { getOrderIdFromRequest } from '@/src/lib/utils/utils'

// TTL for stale orders
const STATUS_TTL = 1000 * 60 * 15 // 15 minutes

export async function GET(req: NextRequest) {
  console.log('[OrderStatus] Request received')

  await connectToDatabase()
  console.log('[OrderStatus] Connected to database')

  try {
    // ================= AUTH =================
    const session = await auth()
    if (!session?.user?.id) {
      console.log('[OrderStatus] Unauthorized: No session')
      return NextResponse.json({ isPaid: false, status: 'UNAUTHORIZED' }, { status: 401 })
    }
    console.log('[OrderStatus] Authenticated user:', session.user.id)

    // ================= ORDER ID =================
    const orderId = getOrderIdFromRequest(req)
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      console.log('[OrderStatus] Invalid orderId:', orderId)
      return NextResponse.json({ isPaid: false, status: 'INVALID_ID' }, { status: 400 })
    }
    console.log('[OrderStatus] Fetching order:', orderId)

    // ================= FETCH ORDER =================
    const order = await OrderModel.findById(orderId)
    if (!order) {
      console.log('[OrderStatus] Order not found:', orderId)
      return NextResponse.json({ isPaid: false, status: 'NOT_FOUND' }, { status: 404 })
    }
    console.log('[OrderStatus] Order found:', order._id.toString())

    // ================= OWNERSHIP CHECK =================
    if (!order.user || order.user.toString() !== session.user.id) {
      console.log('[OrderStatus] Ownership mismatch:', {
        orderUser: order.user?.toString(),
        sessionUser: session.user.id,
      })
      return NextResponse.json({ isPaid: false, status: 'FORBIDDEN' }, { status: 403 })
    }

    // ================= TTL CHECK =================
    const age = Date.now() - order.createdAt.getTime()
    if (!order.isPaid && age > STATUS_TTL) {
      console.log('[OrderStatus] Order expired (TTL):', order._id.toString())
      return NextResponse.json({ isPaid: false, status: 'EXPIRED' }, { status: 410 })
    }

    // ================= RESPONSE =================
    console.log('[OrderStatus] Returning status for order:', order._id.toString())
    return NextResponse.json(
      {
        isPaid: order.isPaid,
        status: order.isPaid ? 'SUCCESS' : order.paymentState ?? 'PENDING',
        paidAt: order.paidAt?.toISOString() ?? null,
        mpesaTransactionId: order.paymentReference?.provider === 'MPESA' ? order.paymentReference.transactionId : null,
        stripeTransactionId: order.paymentReference?.provider === 'STRIPE' ? order.paymentReference.transactionId : null,
        paypalTransactionId: order.paymentReference?.provider === 'PAYPAL' ? order.paymentReference.transactionId : null,
        paymentMethod: order.paymentMethod ?? 'UNKNOWN',
       
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch (err: any) {
    console.error('[OrderStatus] Internal error:', err.message, err.stack)
    return NextResponse.json({ isPaid: false, status: 'ERROR', error: err.message }, { status: 500 })
  }
}
