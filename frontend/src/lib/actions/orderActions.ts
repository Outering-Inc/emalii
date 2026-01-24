/* eslint-disable @typescript-eslint/no-explicit-any */
'use server'
import { cache } from 'react'
import { connectToDatabase } from '../db/dbConnect'
import mongoose from 'mongoose'
import {   Cart, OrderList, OrderItem, ShippingAddress   } from '@/src/types'
import { formatError, round2 } from '../utils/utils'
import { auth } from '../auth'
import { OrderInputSchema } from '../validation/validator'
import OrderModel  from '../db/models/orderModel'
import ProductModel from '../db/models/productModel'
import { DateRange } from 'react-day-picker'
import Product from '../db/models/productModel'
import User from '../db/models/userModel'
import UserModel from '../db/models/userModel'
import { getSetting } from './admin/setting'



/* -------------------------
  1️⃣ ORDER CREATION ACTION
------------------------- */
export const createOrder = cache(async (clientSideCart: Cart) => {
  try {
    await connectToDatabase()
    const session = await auth()
    if (!session) throw new Error('User not authenticated')

    // create order snapshot with validated cart
    const createdOrder = await createOrderFromCart(clientSideCart, session.user.id!)

    return {
      success: true,
      message: 'Order placed successfully',
      data: { orderId: createdOrder._id.toString() },
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
})

/* -------------------------
  2️⃣ CREATE ORDER FROM CART
------------------------- */
const createOrderFromCart = cache(async (clientSideCart: Cart, userId: string) => {
  await connectToDatabase()

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // fetch user snapshot
    const user = await UserModel.findById(userId).session(session)
    if (!user) throw new Error('User not found')

    // validate variant stock BEFORE order creation
    for (const item of clientSideCart.items) {
      const product = await ProductModel.findById(item.product).session(session)
      if (!product) throw new Error(`Product not found`)

      const variant = product.variants?.find(
        (v) => v.color === item.color && v.size === item.size
      )

      if (!variant) throw new Error(`Variant not found (${item.color}, ${item.size})`)
      if (variant.stock < item.quantity)
        throw new Error(`Only ${variant.stock} left for ${product.name} (${item.color}, ${item.size})`)
    }

    // calculate prices and delivery date
    const cartPrice = await calcDeliveryDateAndPrice({
      items: clientSideCart.items,
      shippingAddress: clientSideCart.shippingAddress,
      deliveryDateIndex: clientSideCart.deliveryDateIndex,
    })
    const cart = { ...clientSideCart, ...cartPrice }

    // create order snapshot
    const order = OrderInputSchema.parse({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      items: cart.items,
      shippingAddress: cart.shippingAddress,
      paymentMethod: cart.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
      expectedDeliveryDate: cart.expectedDeliveryDate,
    })

    // create order inside transaction
    const createdOrder = await OrderModel.create([order], { session })
    await session.commitTransaction()

    return createdOrder[0]
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
  }
})

// DEDUCT INVENTORY AFTER PAYMENT

// Optional: Inventory l

/**
 * Deduct inventory for an order after successful payment.
 * Amazon-grade: transactional, atomic, variant-level, idempotent.
 */
/* -------------------------
  3️⃣ DEDUCT INVENTORY (AFTER PAYMENT)
------------------------- */
export async function deductInventoryAfterPayment(orderId: string) {
  await mongoose.connect(process.env.MONGO_URI!)

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const order = await OrderModel.findById(orderId).session(session)
    if (!order) throw new Error('Order not found')

    // idempotency check
    if ((order as any).inventoryDeducted) {
      console.log('Inventory already deducted for order', orderId)
      await session.commitTransaction()
      return
    }

    // loop through order items
    for (const item of order.items) {
      const product = await ProductModel.findById(item.product).session(session)
      if (!product) throw new Error(`Product ${item.name} not found`)
      if (!item.variantId) throw new Error(`variantId missing for product ${product._id} in order ${orderId}`)

      const variant = product.variants?.id(item.variantId)
      if (!variant) throw new Error(`Variant not found for product ${product._id}`)
      if (variant.stock < item.quantity)
        throw new Error(`Insufficient stock for variant ${variant._id} of product ${product._id}`)

      // deduct variant stock
      variant.stock -= item.quantity
      product.countInStock = product.variants!.reduce((sum, v) => sum + v.stock, 0)
      await product.save({ session })
    }

    // mark order as paid & prevent double deduction
    order.isPaid = true
    order.paidAt = new Date()
    ;(order as any).inventoryDeducted = true
    await order.save({ session })

    await session.commitTransaction()
    console.log('Inventory deducted and order marked as paid:', orderId)
  } catch (err) {
    await session.abortTransaction()
    console.error('Error deducting inventory:', err)
    throw err
  } finally {
    session.endSession()
  }
}


 // 4️⃣ GET ORDER BY ID

export const getOrderById = cache(async (orderId: string): Promise<OrderList> => {
  await connectToDatabase()
  const order = await OrderModel.findById(orderId)
  return JSON.parse(JSON.stringify(order))
})

//Define Dser create Order plugin here

// Calculate delivery date and price
export const calcDeliveryDateAndPrice = async ({
  items,
  shippingAddress,
  deliveryDateIndex,
}: {
  deliveryDateIndex?: number
  items: OrderItem[]
  shippingAddress?: ShippingAddress
}) => {
  const { availableDeliveryDates } = await getSetting()
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  )

  const deliveryDate =
    availableDeliveryDates[
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex
    ]
  const shippingPrice =
    !shippingAddress || !deliveryDate
      ? undefined
      : deliveryDate.freeShippingMinPrice > 0 &&
          itemsPrice >= deliveryDate.freeShippingMinPrice
        ? 0
        : deliveryDate.shippingPrice

  const taxPrice = !shippingAddress ? undefined : round2(itemsPrice * 0.16)
  const totalPrice = round2(
    itemsPrice +
      (shippingPrice ? round2(shippingPrice) : 0) +
      (taxPrice ? round2(taxPrice) : 0)
  )
  return {
    availableDeliveryDates,
    deliveryDateIndex:
      deliveryDateIndex === undefined
        ? availableDeliveryDates.length - 1
        : deliveryDateIndex,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  }
}


// GET MY ORDERS WITH PAGINATION
export const getMyOrders = cache(async({
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



// GET ORDERS SUMMARY Using Aggregation Pipeline from Mongodb
export async function getOrderSummary(date: DateRange) {
  await connectToDatabase()

  const ordersCount = await OrderModel.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const productsCount = await Product.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })
  const usersCount = await User.countDocuments({
    createdAt: {
      $gte: date.from,
      $lte: date.to,
    },
  })

  const totalSalesResult = await OrderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
    { $project: { totalSales: { $ifNull: ['$sales', 0] } } },
  ])
  const totalSales = totalSalesResult[0] ? totalSalesResult[0].totalSales : 0

  const today = new Date()
  const sixMonthEarlierDate = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  )
  const monthlySales = await OrderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: sixMonthEarlierDate,
        },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        label: '$_id',
        value: '$totalSales',
      },
    },

    { $sort: { label: -1 } },
  ])
  const topSalesCategories = await getTopSalesCategories(date)
  const topSalesProducts = await getTopSalesProducts(date)

  const {
    common: { pageSize },
  } = await getSetting()
  const limit = pageSize
  const latestOrders = await OrderModel.find()
    .populate('user', 'name')
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    monthlySales: JSON.parse(JSON.stringify(monthlySales)),
    salesChartData: JSON.parse(JSON.stringify(await getSalesChartData(date))),
    topSalesCategories: JSON.parse(JSON.stringify(topSalesCategories)),
    topSalesProducts: JSON.parse(JSON.stringify(topSalesProducts)),
    latestOrders: JSON.parse(JSON.stringify(latestOrders)) as OrderList[],
  }
}

// GET ALL ORDERS SUMMARY Using Drizzle Pipeline from postgresql

export const getSalesChartData = cache(async(date: DateRange) => {
  const result = await OrderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    {
      $project: {
        _id: 0,
        date: {
          $concat: [
            { $toString: '$_id.year' },
            '/',
            { $toString: '$_id.month' },
            '/',
            { $toString: '$_id.day' },
          ],
        },
        totalSales: 1,
      },
    },
    { $sort: { date: 1 } },
  ])

  return result
})

//getTopSalesProducts pipeline
export const getTopSalesProducts = cache(async(date: DateRange) => {
  const result = await OrderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },

    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: {
          name: '$items.name',
          image: '$items.image',
          _id: '$items.product',
        },
        totalSales: {
          $sum: { $multiply: ['$items.quantity', '$items.price'] },
        }, // Assume quantity field in orderItems represents units sold
      },
    },
    {
      $sort: {
        totalSales: -1,
      },
    },
    { $limit: 6 },

    // Step 3: Replace productInfo array with product name and format the output
    {
      $project: {
        _id: 0,
        id: '$_id._id',
        label: '$_id.name',
        image: '$_id.image',
        value: '$totalSales',
      },
    },

    // Step 4: Sort by totalSales in descending order
    { $sort: { _id: 1 } },
  ])

  return result
})

//getTopSalesCategories pipeline
export const getTopSalesCategories = cache(async(date: DateRange, limit = 5) => {
  const result = await OrderModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: date.from,
          $lte: date.to,
        },
      },
    },
    // Step 1: Unwind orderItems array
    { $unwind: '$items' },
    // Step 2: Group by productId to calculate total sales per product
    {
      $group: {
        _id: '$items.category',
        totalSales: { $sum: '$items.quantity' }, // Assume quantity field in orderItems represents units sold
      },
    },
    // Step 3: Sort by totalSales in descending order
    { $sort: { totalSales: -1 } },
    // Step 4: Limit to top N products
    { $limit: limit },
  ])

  return result
})

