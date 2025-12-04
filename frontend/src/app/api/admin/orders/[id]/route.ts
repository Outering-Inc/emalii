'use server'
import mongoose from 'mongoose'
import dbConnect from "@/src/lib/db/dbConnect";
import { formatError } from "@/src/lib/utils/utils";
import { revalidatePath } from "next/cache";

import { sendAskReviewOrderItems, sendPurchaseReceipt } from "@/src/emails";
import OrderModel from "@/src/lib/db/models/orderModel";
import ProductModel from "@/src/lib/db/models/productModel";

import { PAGE_SIZE } from '@/src/lib/constants'
import { OrderList } from '@/src/types'
import { cache } from 'react'



//Get Order by Id
export const adminGetOrderById = cache(async(orderId: string): Promise<OrderList> => {
  await dbConnect()
  const order = await OrderModel.findById(orderId)
  return JSON.parse(JSON.stringify(order))
})


// GET MY ORDERS WITH PAGINATION
export async function adminGetAllOrders({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  limit = limit || PAGE_SIZE
  await dbConnect()
  const skipAmount = (Number(page) - 1) * limit
  const orders = await OrderModel.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const ordersCount = await OrderModel.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(orders)) as OrderList[],
    totalPages: Math.ceil(ordersCount / limit),
  }
}



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


//UPDATE ORDER TO PAID
export async function updateOrderToPaid(orderId: string) {
  try {
    await dbConnect()
    const order = await OrderModel.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()
    if (!process.env.MONGODB_URI?.startsWith('mongodb://localhost'))
      await updateProductStock(order._id)
    if (order.user.email) await sendPurchaseReceipt({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}

//UPDATE PRODUCT STOCK
const updateProductStock = async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      { isPaid: true, paidAt: new Date() },
      opts
    )
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await ProductModel.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      product.countInStock -= item.quantity
      await ProductModel.updateOne(
        { _id: product._id },
        { countInStock: product.countInStock },
        opts
      )
    }
    await session.commitTransaction()
    session.endSession()
    return true
  } catch (error) {
    await session.abortTransaction()
    session.endSession()
    throw error
  }
}

//DELIVER ORDER
export async function deliverOrder(orderId: string) {
  try {
    await dbConnect()
    const order = await OrderModel.findById(orderId).populate<{
      user: { email: string; name: string }
    }>('user', 'name email')
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()
    if (order.user.email) await sendAskReviewOrderItems({ order })
    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
}



//Define Dser create Order plugin here











