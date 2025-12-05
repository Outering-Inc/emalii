// /types/product.ts

import { Product } from "@/src/lib/db/models/productModel"

export interface GetAllProductsParams {
  query: string
  category: string
  tag: string
  page: number
  limit: number
}

export interface GetAllProductsResult {
  products: Product[]
  total: number
  page: number
  pages: number
}

export interface GetProductsByTextSearchParams {
  products: Product[]
  total: number
  page: number
  pages: number
}


export interface LeanProduct {
  _id: string
  slug: string
  name: string
  brand: string
  category: string
  price: number
  listPrice?: number
  avgRating: number
  numReviews: number
  tags: string[]
  images: string[]
  sizes: string[]
  colors: string[]
  countInStock: number
}
