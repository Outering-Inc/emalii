/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/src/lib/auth'
import dbConnect from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

export const GET = auth(async (...args: any) => {
  const [req, { params }] = args

  if (!req.auth) {
    return Response.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    await dbConnect()
    const order = await OrderModel.findById(params.id)
      // Log params to debug
    console.log("Incoming Order ID:", params.id);

    if (!order) {
      return Response.json({ message: 'Order not found' }, { status: 404 })
    }

    return Response.json(order)
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 500 })
  }
}) as any
