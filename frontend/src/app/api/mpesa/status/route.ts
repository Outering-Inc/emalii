'use server'

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import MpesaTransaction from '@/src/lib/db/models/mpesaModel'
import OrderModel from '@/src/lib/db/models/orderModel'

export async function GET(req: NextRequest) {
  await connectToDatabase()

  const checkoutRequestId = req.nextUrl.searchParams.get('checkoutRequestId')

  if (!checkoutRequestId) {
    return NextResponse.json(
      { status: 'FAILED', reason: 'Missing checkoutRequestId' },
      { status: 400 }
    )
  }

  // 1️⃣ Find Mpesa transaction
  const tx = await MpesaTransaction.findOne({ checkoutRequestId })

  if (!tx) {
    // No transaction yet → PENDING
    return NextResponse.json({ status: 'PENDING' })
  }

  // 2️⃣ If transaction resolved → return immediately
  if (tx.status === 'SUCCESS' || tx.status === 'FAILED') {
    return NextResponse.json({
      status: tx.status,
      orderId: tx.orderId?.toString(),
    })
  }

  // 3️⃣ Fallback: check order state (CRITICAL)
  if (tx.orderId) {
    const order = await OrderModel.findById(tx.orderId)
    if (order?.isPaid) {
      return NextResponse.json({
        status: 'SUCCESS',
        orderId: order._id.toString(),
      })
    }
  }

  // 4️⃣ Still pending
  return NextResponse.json({ status: 'PENDING' })
}