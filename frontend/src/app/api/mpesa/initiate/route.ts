'use server'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { createMpesaOrder } from '@/src/lib/actions/mpesaActions'
import { formatError } from '@/src/lib/utils/utils'

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase()

    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { phone, amount, orderId } = await req.json()
    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Phone, amount, and orderId are required' },
        { status: 400 }
      )
    }

    // ✅ Find the order using ONLY orderId and userId
    const order = await OrderModel.findOne({
      _id: orderId,
      user: session.user.id,
      isPaid: false,
    })

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'No matching unpaid order found' },
        { status: 404 }
      )
    }

    // Call STK Push
    const response = await createMpesaOrder(orderId)

    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: response.data }, { status: 200 })
  } catch (error) {
    console.error('Mpesa Initiate Error:', error)
    return NextResponse.json(
      { success: false, message: formatError(error) },
      { status: 500 }
    )
  }
}
