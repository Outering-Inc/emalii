'use server'

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { auth } from '@/src/lib/auth'
import { getOrderIdFromRequest } from '@/src/lib/utils/utils'

// ⏱ TTL mirror (must match DB TTL)
const STATUS_TTL = 1000 * 60 * 15 // 15 minutes

export async function GET(req: NextRequest) {
  await connectToDatabase()

  try {
    /* ================= AUTH ================= */
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { isPaid: false },
        { status: 401 }
      )
    }

    /* ================= ORDER ================= */
    const orderId = getOrderIdFromRequest(req)
    const order = await OrderModel.findById(orderId)

    if (!order) {
      return NextResponse.json(
        { isPaid: false },
        { status: 404 }
      )
    }

    /* ================= OWNERSHIP ================= */
    if (order.user.toString() !== session.user.id) {
      return NextResponse.json(
        { isPaid: false },
        { status: 403 }
      )
    }

    /* ================= TTL ================= */
    const age = Date.now() - order.createdAt.getTime()
    if (!order.isPaid && age > STATUS_TTL) {
      return NextResponse.json(
        { isPaid: false, status: 'FAILED' },
        { status: 410 }
      )
    }

    /* ================= RESPONSE ================= */
    return NextResponse.json(
      {
        isPaid: order.isPaid,
        status: order.mpesaPaymentStatus,
        paidAt: order.paidAt?.toISOString() ?? null,
        mpesaTransactionId: order.mpesaTransactionId ?? null,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    )
  } catch {
    // 🔒 Never leak internals
    return NextResponse.json(
      { isPaid: false },
      { status: 500 }
    )
  }
}
