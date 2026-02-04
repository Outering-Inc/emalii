'use server'

import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

export async function GET(
  _req: Request,
  { params }: { params: { orderId: string } }
) {
  await connectToDatabase()

  const order = await OrderModel.findById(params.orderId)

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