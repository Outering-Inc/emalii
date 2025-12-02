"use server"

import { cache } from "react"
import { PAGE_SIZE } from "@/src/lib/constants"
import dbConnect from "@/src/lib/db/dbConnect"
import ProductModel, { Product } from "@/src/lib/db/models/productModel"
import { formatError } from "@/src/lib/utils/utils"
import { ProductInputSchema, ProductUpdateSchema } from "@/src/lib/validation/validator"
import { ProductInput } from "@/src/types"
import { revalidatePath } from "next/cache"
import z from "zod"


//ADMIN GET PRODUCT BY ID
export const adminGetProductById = cache(async(id: string) =>{
  await dbConnect()
  const product = await ProductModel.findById(id).lean();
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as Product
})

// ADMIN CREATE PRODUCT
export async function adminCreateProduct(data: ProductInput) {
  try {
    const product = ProductInputSchema.parse(data)
    await dbConnect()
    await ProductModel.create(product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

//ADMIN UPDATE PRODUCT
export async function adminUpdateProduct(data: z.infer<typeof ProductUpdateSchema>) {
  try {
    const product = ProductUpdateSchema.parse(data)
    await dbConnect()
    await ProductModel.findByIdAndUpdate(product._id, product)
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}


// ADMIN DELETE PRODUCT
export async function adminDeleteProduct(id: string) {
  try {
    await dbConnect()
    const res = await ProductModel.findByIdAndDelete(id)
    if (!res) throw new Error('Product not found')
    revalidatePath('/admin/products')
    return {
      success: true,
      message: 'Product deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}


// ADMIN GET ALL PRODUCTS
export async function adminGetAllProducts({
  query,
  page = 1,
  sort = 'latest',
  limit,
}: {
  query: string
  page?: number
  sort?: string
  limit?: number
}) {
  await dbConnect()

  const pageSize = limit || PAGE_SIZE
  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}

  const order: Record<string, 1 | -1> =
    sort === 'best-selling'
      ? { numSales: -1 }
      : sort === 'price-low-to-high'
        ? { price: 1 }
        : sort === 'price-high-to-low'
          ? { price: -1 }
          : sort === 'avg-customer-review'
            ? { avgRating: -1 }
            : { _id: -1 }
  const products = await ProductModel.find({
    ...queryFilter,
  })
    .sort(order)
    .skip(pageSize * (Number(page) - 1))
    .limit(pageSize)
    .lean()

  const countProducts = await ProductModel.countDocuments({
    ...queryFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as Product[],
    totalPages: Math.ceil(countProducts / pageSize),
    totalProducts: countProducts,
    from: pageSize * (Number(page) - 1) + 1,
    to: pageSize * (Number(page) - 1) + products.length,
  }
}


// ADMIN GET ALL TAGS
export async function getAllTags() {
  const tags = await ProductModel.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: null, uniqueTags: { $addToSet: '$tags' } } },
    { $project: { _id: 0, uniqueTags: 1 } },
  ])
  return (
    (tags[0]?.uniqueTags
      .sort((a: string, b: string) => a.localeCompare(b))
      .map((x: string) =>
        x
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      ) as string[]) || []
  )
}