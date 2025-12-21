'use server'

import { cache } from 'react'
import { connectToDatabase } from '../db/dbConnect'
import ProductModel, { Product } from '../db/models/productModel'
import { getSetting } from './admin/setting'
import { slugify } from '../utils/utils'


// =========================
//      ACTIONS
// =========================


// all categories
export const getAllCategories = cache(async() => {
  await connectToDatabase()
  return ProductModel.find({ isPublished: true }).distinct('category')
})

// products for card
export const getProductsForCard = cache(async({
  tag,
  limit = 1000, // fetch all products by default mongoose limit
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

// products for categories grid
export const getCategoryGrid = cache(async () => {
  await connectToDatabase()

  const categories = await ProductModel.aggregate([
    { $match: { isPublished: true } },
    {
      $group: {
        _id: '$category',
        image: { $first: { $arrayElemAt: ['$images', 0] } },
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        image: 1,
        href: {
          $concat: ['/search?category=', '$_id'],
        },
      },
    },
    { $sort: { name: 1 } },
  ])

  return JSON.parse(JSON.stringify(categories)) as {
    name: string
    image: string
    href: string
  }[]
})

// category grid by tag

export const getCategoryGridByTag = cache(
  async ({ tag }: { tag: string }) => {
    await connectToDatabase()

    // ✅ Normalize incoming tag
    const normalizedTag = slugify(tag)

    const categories = await ProductModel.aggregate([
      // 1️⃣ Match published products with normalized tag
      {
        $match: {
          isPublished: true,
          tags: normalizedTag,
          category: { $ne: '' },
          images: { $exists: true, $ne: [] },
        },
      },

      // 2️⃣ Sort so $first image is deterministic
      {
        $sort: { createdAt: -1 },
      },

      // 3️⃣ Group by category
      {
        $group: {
          _id: '$category',
          image: { $first: { $arrayElemAt: ['$images', 0] } },
        },
      },

      // 4️⃣ Project clean response
      {
        $project: {
          _id: 0,
          name: '$_id', // Human readable
          slug: {
            $toLower: {
              $replaceAll: {
                input: '$_id',
                find: ' ',
                replacement: '-',
              },
            },
          },
          image: 1,
        },
      },

      // 5️⃣ Alphabetical order
      {
        $sort: { name: 1 },
      },
    ])

    // 6️⃣ Build hrefs safely in JS
    return categories.map((cat) => ({
      name: cat.name,
      image: cat.image,
      href: `/search?category=${cat.slug}&tag=${normalizedTag}`,
    })) as {
      name: string
      image: string
      href: string
    }[]
  }
)



// products by tag
export const getProductsByTag = cache(async({
  tag,
  limit = 1000, // fetch all products by default
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
export async function getRelatedProductsByCategory({
  category,
  productId,
  limit = 4,
  page = 1,
}: {
  category: string
  productId: string
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()
  const skipAmount = (Number(page) - 1) * limit
  const conditions = {
    isPublished: true,
    category,
    _id: { $ne: productId },
  }
  const products = await ProductModel.find(conditions)
    .sort({ numSales: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const productsCount = await ProductModel.countDocuments(conditions)
  return {
    data: JSON.parse(JSON.stringify(products)) as Product[],
    totalPages: Math.ceil(productsCount / limit),
  }
}

// =========================
//   MAIN SEARCH ACTION
// =========================
export async function getAllProducts({
  query,
  limit,
  page,
  category,
  tag,
  price,
  rating,
  sort,
}: {
  query: string
  category: string
  tag: string
  limit?: number
  page: number
  price?: string
  rating?: string
  sort?: string
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const queryFilter =
    query && query !== 'all'
      ? {
          name: {
            $regex: query,
            $options: 'i',
          },
        }
      : {}
  const categoryFilter = category && category !== 'all' ? { category } : {}
  const tagFilter = tag && tag !== 'all' ? { tags: tag } : {}

  const ratingFilter =
    rating && rating !== 'all'
      ? {
          avgRating: {
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
  const products = await ProductModel.find({
    ...isPublished,
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
    .sort(order)
    .skip(limit * (Number(page) - 1))
    .limit(limit)
    .lean()

  const countProducts = await ProductModel.countDocuments({
    ...queryFilter,
    ...tagFilter,
    ...categoryFilter,
    ...priceFilter,
    ...ratingFilter,
  })
  return {
    products: JSON.parse(JSON.stringify(products)) as Product[],
    totalPages: Math.ceil(countProducts / limit),
    totalProducts: countProducts,
    from: limit * (Number(page) - 1) + 1,
    to: limit * (Number(page) - 1) + products.length,
  }
}

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


export const getCategories = cache(async () => {
  await connectToDatabase()
  const categories = await ProductModel.find().distinct('category')
  return categories
})

