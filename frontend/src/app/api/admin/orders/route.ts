/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/src/lib/auth'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'

export const GET = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== 'Admin') {
    return Response.json(
      { message: 'unauthorized' },
      { status: 401 }
    )
  }

  await connectToDatabase()

  // Pagination support
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10)
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10', 10)
  const skip = (page - 1) * limit

  const totalOrders = await OrderModel.countDocuments()
  const totalPages = Math.ceil(totalOrders / limit)

  const orders = await OrderModel.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('user', 'name email') // Include email if needed

  return Response.json({
    data: orders,
    totalPages,
  })
}) as any
