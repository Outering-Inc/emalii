'use server'

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

export async function GET(req: NextRequest) {
  await connectToDatabase()

  // Get orderId from query params instead of route params
  const orderId = req.nextUrl.searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json(
      { isPaid: false, reason: 'Missing orderId' },
      { status: 400 }
    )
  }

  const order = await OrderModel.findById(orderId)

  if (!order) {
    return NextResponse.json(
      { isPaid: false },
      { status: 404 }
    )
  }

  return NextResponse.json({
    isPaid: order.isPaid,
  })
}