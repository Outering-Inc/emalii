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
  _id?: string
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

 
  /* Derived variant selectors */
  colors: string[] // DRY: derive from variants if not set in DB
  sizes: string[]  // DRY: derive from variants if not set in DB

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

