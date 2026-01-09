/* -----------------------------
   API Params & Results
------------------------------ */

export interface GetAllProductsParams {
  query: string
  category: string
  tag: string
  page: number
  limit: number
}

export interface GetAllProductsResult {
  products: LeanProduct[]
  total: number
  page: number
  pages: number
}

/* -----------------------------
   Ratings & Reviews
------------------------------ */

export interface RatingDistributionItem {
  rating: number // 1–5
  count: number
}

/* -----------------------------
   Variant Model (Amazon-style)
------------------------------ */

export interface ProductVariant {
  color: string
  size?: string
  stock: number
  sku?: string
  images?: string[]
}

/* -----------------------------
   Lean Product (Client-safe)
------------------------------ */

export interface LeanProduct {
  _id: string
  slug: string
  name: string
  brand: string
  category: string

  price: number
  listPrice?: number

  /* Ratings */
  avgRating: number
  numReviews: number
  ratingDistribution?: RatingDistributionItem[]

  /* Variant selectors */
  colors: string[]
  sizes: string[]

  /* Media */
  images: string[]
  variantImages?: Record<string, string[]> // color → images[]

  /* Inventory (derived, NOT edited manually) */
  countInStock: number

  /* Variants */
  variants?: ProductVariant[]

  isPublished: boolean

  /* Meta */
  tags: string[]
}
