'use server'
import mongoose from 'mongoose'
import { connectToDatabase } from '@/src/lib/db/dbConnect'
import { formatError } from "@/src/lib/utils/utils"
import { revalidatePath } from "next/cache"

import { sendAskReviewOrderItems, sendPurchaseReceipt } from "@/src/emails"
import OrderModel from "@/src/lib/db/models/orderModel"
import ProductModel from "@/src/lib/db/models/productModel"

import { OrderList } from '@/src/types'
import { cache } from 'react'
import { getSetting } from './setting'

// -----------------------------
// ADMIN: GET ORDER BY ID
// -----------------------------
export const adminGetOrderById = cache(async (orderId: string): Promise<OrderList> => {
  await connectToDatabase()
  const order = await OrderModel.findById(orderId)
  if (!order) throw new Error('Order not found')

  // Return as plain object (snapshot) for type safety
  return JSON.parse(JSON.stringify(order)) as OrderList
})

// -----------------------------
// ADMIN: GET ALL ORDERS (PAGINATION)
// -----------------------------
export const adminGetAllOrders = cache(async ({
  limit,
  page,
}: {
  limit?: number
  page: number
}) => {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit

  // Fetch orders sorted by latest first
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
})

// -----------------------------
// ADMIN: DELETE ORDER
// -----------------------------
export const adminDeleteOrder = cache(async (id: string) => {
  try {
    await connectToDatabase()
    const res = await OrderModel.findByIdAndDelete(id)
    if (!res) throw new Error('Order not found')

    // Revalidate orders page
    revalidatePath('/admin/orders')

    return { success: true, message: 'Order deleted successfully' }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
})

// -----------------------------
// UPDATE ORDER TO PAID
// -----------------------------
export const updateOrderToPaid = cache(async (orderId: string) => {
  try {
    await connectToDatabase()

    // Fetch order snapshot (user info stored directly in order)
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')
    if (order.isPaid) throw new Error('Order is already paid')

    // Update order
    order.isPaid = true
    order.paidAt = new Date()
    await order.save()

    // Update stock for all items
    if (!process.env.MONGODB_URI?.startsWith('mongodb://localhost')) {
      await updateProductStock(order._id)
    }

    // Send receipt using stored snapshot
    if (order.user?.email) {
      await sendPurchaseReceipt({ order })
    }

    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order paid successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
})

// -----------------------------
// UPDATE PRODUCT STOCK
// -----------------------------
export const updateProductStock = cache(async (orderId: string) => {
  const session = await mongoose.connection.startSession()

  try {
    session.startTransaction()
    const opts = { session }

    const order = await OrderModel.findById(orderId).session(session)
    if (!order) throw new Error('Order not found')

    for (const item of order.items) {
      const product = await ProductModel.findById(item.product).session(session)
      if (!product) throw new Error('Product not found')

      // Reduce stock by quantity
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
})

// -----------------------------
// DELIVER ORDER
// -----------------------------
export const deliverOrder = cache(async (orderId: string) => {
  try {
    await connectToDatabase()
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')
    if (!order.isPaid) throw new Error('Order is not paid')

    // Update delivery status
    order.isDelivered = true
    order.deliveredAt = new Date()
    await order.save()

    // Send review request using stored snapshot
    if (order.user?.email) {
      await sendAskReviewOrderItems({ order })
    }

    revalidatePath(`/account/orders/${orderId}`)
    return { success: true, message: 'Order delivered successfully' }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
})

// -----------------------------
// CREATE ORDER FROM CART
// -----------------------------
