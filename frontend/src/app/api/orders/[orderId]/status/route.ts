'use server'

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

export async function GET(
  _req: NextRequest,
  context: { params: { orderId: string } }
) {
  await connectToDatabase()

  const { orderId } = context.params

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