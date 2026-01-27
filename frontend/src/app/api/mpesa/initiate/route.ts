'use server'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/src/lib/auth'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { createMpesaOrder } from '@/src/lib/actions/mpesaActions'
import { formatError } from '@/src/lib/utils/utils'
import { normalizeKenyanPhone } from '@/src/lib/utils/mpesa'

export async function POST(req: NextRequest) {
  try {
    // 1️⃣ DB
    await connectToDatabase()

    // 2️⃣ Auth
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // 3️⃣ Body
    const { phone, amount, orderId } = await req.json()
    if (!phone || !amount || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Phone, amount, and orderId are required' },
        { status: 400 }
      )
    }

    // ✅ 4️⃣ Normalize ONCE (IMPORTANT)
    const normalizedPhone = normalizeKenyanPhone(phone)

    // 5️⃣ Find order (UNCHANGED)
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

    // ✅ 6️⃣ Persist normalized phone (Amazon/Jumia style)
    order.shippingAddress.phone = normalizedPhone
    await order.save()

    // 7️⃣ STK Push (UNCHANGED)
    const response = await createMpesaOrder(orderId)

    if (!response.success) {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: true, data: response.data },
      { status: 200 }
    )
  } catch (error) {
    console.error('Mpesa Initiate Error:', error)
    return NextResponse.json(
      { success: false, message: formatError(error) },
      { status: 500 }
    )
  }
}
