'use server'

import { cache } from 'react'
import { connectToDatabase } from '../db/dbConnect'
import ProductModel, { Product } from '../db/models/productModel'

// =========================
//      TYPES & CONSTANTS
// =========================
export interface GetAllProductsParams {
  query?: string
  category?: string
  tag?: string
  page: number
  limit?: number
  price?: string        // e.g. "10-50"
  rating?: number       // numeric value (e.g. 4)
  sort?: string
  filters?: Record<string, unknown>// <-- add this
}

export interface GetAllProductsResult {
  products: Product[]
  totalPages: number
  totalProducts: number
  from: number
  to: number
}

const PAGE_SIZE = 10

// =========================
//      ACTIONS
// =========================

// ADMIN: all products
export const getAllProductsForAdmin = cache(async() => {
  await connectToDatabase()
  return ProductModel.find({ isPublished: true }).distinct('category')
})

// all categories
export const getAllCategories = cache(async() => {
  await connectToDatabase()
  return ProductModel.find({ isPublished: true }).distinct('category')
})

// products for card
export const getProductsForCard = cache(async({
  tag,
  limit = 4,
}: {
  tag: string
  limit?: number
}) => {
  await connectToDatabase()
  const products = await ProductModel.find(
    { tags: { $in: [tag] }, isPublished: true },
    {
      name: 1,
      href: { $concat: ['/product/', '$slug'] },
      image: { $arrayElemAt: ['$images', 0] },
    }
  )
    .sort({ createdAt: 'desc' })
    .limit(limit)
  return JSON.parse(JSON.stringify(products)) as {
    name: string
    href: string
    image: string
  }[]
})

// products by tag
export const getProductsByTag = cache(async({
  tag,
  limit = 10,
}: {
  tag: string
  limit?: number
}) => {
  await connectToDatabase()
  const products = await ProductModel.find({
    tags: { $in: [tag] },
    isPublished: true,
  })
    .sort({ createdAt: 'desc' })
    .limit(limit)

  return JSON.parse(JSON.stringify(products)) as Product[]
})

// product by slug
export const  getProductBySlug = cache(async(slug: string) => {
  await connectToDatabase()
  const product = await ProductModel.findOne({ slug, isPublished: true })
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as Product
})


// product by Id
export const getProductById = cache(async(id: string) =>{
  await connectToDatabase()
  const product = await ProductModel.findById(id).lean();
  if (!product) throw new Error('Product not found')
  return JSON.parse(JSON.stringify(product)) as Product
})

// Related products
export const getRelatedProductsByCategory = cache(async ({
  category,
  productId,
  limit = PAGE_SIZE,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) => {
  await connectToDatabase()
  const skipAmount = (page - 1) * limit
  const conditions = { isPublished: true, category, _id: { $ne: productId } }

  const products = await ProductModel.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)

  const total = await ProductModel.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as Product[],
    totalPages: Math.ceil(total / limit),
  }
})

// =========================
//   MAIN SEARCH ACTION
// =========================
export const getAllProducts = cache(async ({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: GetAllProductsParams): Promise<GetAllProductsResult> => {
  const perPage = limit ?? PAGE_SIZE
  await connectToDatabase()

  // filters
  const queryFilter =
    query && query !== 'all'
      ? { name: { $regex: query, $options: 'i' } }
      : {}

  const categoryFilter =
    category && category !== 'all' ? { category } : {}

  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    typeof rating === 'number'
      ? { avgRating: { $gte: rating } }
      : {}

  const priceFilter =
    price && price !== 'all'
      ? (() => {
          const [min, max] = price.split('-').map((p) => Number(p))
          return { price: { $gte: min, $lte: max } }
        })()
      : {}

  // sort options
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

  const isPublished = { isPublished: true }

  // query db
  const products = await ProductModel.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(perPage * (page - 1))
    .limit(perPage)
    .lean<Product[]>()

  const count = await ProductModel.countDocuments({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })

  return {
    products: JSON.parse(JSON.stringify(products)) as Product[],
    totalPages: Math.ceil(count / perPage),
    totalProducts: count,
    from: perPage * (page - 1) + 1,
    to: perPage * (page - 1) + products.length,
  }
})

// =========================
//      TAGS
// =========================
export const getAllTags = cache(async() => {
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
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')
      ) as string[]) || []
  )
})

//GET SEARCH RESULTS FROM EXTERNAL API
export const getSearchResults = cache(async(query: string, page = 1, limit = 12) => { 
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/products?q=${encodeURIComponent(
      query
    )}&page=${page}&limit=${limit}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch search results: ${res.statusText}`);
  }

  return res.json();
})




//Get latest products
export const getLatest = cache(async () => {
  await connectToDatabase()
  const products = await ProductModel.find({}).sort({ _id: -1 }).limit(6).lean()
  return products as Product[]
})

export const getFeatured = cache(async () => {
  await connectToDatabase()
  const products = await ProductModel.find({ isFeatured: true }).limit(3).lean()
  return products as Product[]
})

export const getBySlug = cache(async (slug: string) => {
  await connectToDatabase()
  const product = await ProductModel.findOne({ slug }).lean()
  return product as Product
})


export const getByQuery = cache(
  async ({
    q,
    category,
    sort,
    price,
    rating,
    page = '1',
  }: {
    q: string
    category: string
    price: string
    rating: string
    sort: string
    page: string
  }) => {
    await connectToDatabase()

    const queryFilter =
      q && q !== 'all'
        ? {
            name: {
              $regex: q,
              $options: 'i',
            },
          }
        : {}
    const categoryFilter = category && category !== 'all' ? { category } : {}
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {}
    // 10-50
    const priceFilter =
      price && price !== 'all'
        ? {
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {}
    const order: Record<string, 1 | -1> =
      sort === 'lowest'
        ? { price: 1 }
        : sort === 'highest'
        ? { price: -1 }
        : sort === 'toprated'
        ? { rating: -1 }
        : { _id: -1 }

    const categories = await ProductModel.find().distinct('category')
    const products = await ProductModel.find(
      {
        ...queryFilter,
        ...categoryFilter,
        ...priceFilter,
        ...ratingFilter,
      },
      '-reviews'
    )
      .sort(order)
      .skip(PAGE_SIZE * (Number(page) - 1))
      .limit(PAGE_SIZE)
      .lean()

    const countProducts = await ProductModel.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })

    return {
      products: products as Product[],
      countProducts,
      page,
      pages: Math.ceil(countProducts / PAGE_SIZE),
      categories,
    }
  }
)

export const getCategories = cache(async () => {
  await connectToDatabase()
  const categories = await ProductModel.find().distinct('category')
  return categories
})

