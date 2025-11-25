/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/src/lib/auth"
import dbConnect from "@/src/lib/db/dbConnect"
import OrderModel from "@/src/lib/db/models/orderModel"
import ProductModel from "@/src/lib/db/models/productModel"
import UserModel from "@/src/lib/db/models/userModel"

export const GET = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== 'Admin') { // Added admin check
    return Response.json(
      { message: 'unauthorized' },
      {
        status: 401,
      }
    )
  }

  await dbConnect()

  const ordersCount = await OrderModel.countDocuments()
  const productsCount = await ProductModel.countDocuments()
  const usersCount = await UserModel.countDocuments()

  const ordersPriceGroup = await OrderModel.aggregate([
    {
      $group: {
        _id: null,
        sales: { $sum: '$totalPrice' },
      },
    },
  ])
  const ordersPrice =
    ordersPriceGroup.length > 0 ? ordersPriceGroup[0].sales : 0

  const salesData = await OrderModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalOrders: { $sum: 1 },
        totalSales: { $sum: '$totalPrice' },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const productsData = await ProductModel.aggregate([
    {
      $group: {
        _id: '$category',
        totalProducts: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  const usersData = await UserModel.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        totalUsers: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ])

  return Response.json({
    ordersCount,
    productsCount,
    usersCount,
    ordersPrice,
    salesData,
    productsData,
    usersData,
  })
}) as any