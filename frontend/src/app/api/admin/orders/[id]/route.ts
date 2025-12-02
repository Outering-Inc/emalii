'use server'

import { auth } from '@/src/lib/auth'
import { PAGE_SIZE } from '@/src/lib/constants'
import dbConnect from '@/src/lib/db/dbConnect'
import OrderModel from '@/src/lib/db/models/orderModel'
import { formatError } from '@/src/lib/utils/utils'
import { OrderList } from '@/src/types'
import { revalidatePath } from 'next/cache'
import { cache } from 'react'



//Get Order by Id
export const adminGetOrderById = cache(async(orderId: string): Promise<OrderList> => {
  await dbConnect()
  const order = await OrderModel.findById(orderId)
  return JSON.parse(JSON.stringify(order))
})


// GET MY ORDERS WITH PAGINATION
export const adminGetAllOrders = cache(async({
  limit,
  page,
}: {
  limit?: number
  page: number
}) => {
  
  limit = limit || PAGE_SIZE
  await dbConnect()
  const session = await auth()
  if (!session) {
    throw new Error('User is not authenticated')
  }
  const skipAmount = (Number(page) - 1) * limit
  const orders = await OrderModel.find({
    user: session?.user?.id,
  })
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await OrderModel.countDocuments({ user: session?.user?.id })

  return {
    data: JSON.parse(JSON.stringify(orders)), //convert order to plain javascript object
    totalPages: Math.ceil(ordersCount / limit),
  }
})


// DELETE
export async function adminDeleteOrder(id: string) {
  try {
    await dbConnect()
    const res = await OrderModel.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')
    revalidatePath('/admin/orders')
    return {
      success: true,
      message: 'Order deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

//Define Dser create Order plugin here











