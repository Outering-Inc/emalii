'use server'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import { formatError } from '@/src/lib/utils/utils'
import { createMpesaOrder } from '@/src/lib/actions/mpesaActions'
import OrderModel from '@/src/lib/db/models/orderModel'

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ Connect to DB first
    await connectToDatabase()

    // 2️⃣ Authenticate user
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 })
    }

    const userId = session.user.id

    // 3️⃣ Parse request body
    const { phone, amount } = await req.json()
    if (!phone || !amount) {
      return NextResponse.json({ success: false, message: 'Phone and amount are required' }, { status: 400 })
    }

    // 4️⃣ Find unpaid order for this user
    const order = await OrderModel.findOne({
      'shippingAddress.phone': phone,
      totalPrice: amount,
      user: userId,
      isPaid: false,
    })

    if (!order) {
      return NextResponse.json({ success: false, message: 'No matching unpaid order found' }, { status: 404 })
    }

    // 5️⃣ Call Mpesa STK push (isolated)
    const response = await createMpesaOrder(order._id.toString())

    if (!response.success) {
      return NextResponse.json({ success: false, message: response.message }, { status: 400 })
    }

    // 6️⃣ Return success
    return NextResponse.json({ success: true, data: response.data }, { status: 200 })
  } catch (error) {
    console.error('Checkout server error:', error)

    if (error instanceof Error && error.message.includes('Mpesa API Error')) {
      return NextResponse.json({ success: false, message: `Mpesa API Error: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: false, message: formatError(error) }, { status: 500 })
  }
}
