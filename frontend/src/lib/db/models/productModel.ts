import { Document, Model, model, models, Schema } from 'mongoose'
import { ProductInput } from '@/src/types'
import { slugify } from '@/src/lib/utils/utils'

// ✅ Variant interface
export interface Variant {
  color: string
  size: string
  stock: number
  sku?: string
  images?: string[]
}

export interface Product extends Document, ProductInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  categorySlug?: string
  tagsSlug?: string[]
  variants?: Variant[] // NEW: variant-level stock
}

const variantSchema = new Schema<Variant>({
  color: { type: String, required: true },
  size: { type: String, required: true },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String },
  images: { type: [String], default: [] },
})

const productSchema = new Schema<Product>(
  {
    // Basic Info
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true },

    // Product Attributes
    tags: { type: [String], default: ['new-arrival'] },
    tagsSlug: { type: [String], index: true },
    colors: { type: [String], default: ['White', 'Red', 'Black'] },
    sizes: { type: [String], default: ['S', 'M', 'L'] },
    attributes: { type: Map, of: String },

    // Category hierarchy
    category: { type: String, required: true },
    categorySlug: { type: String, index: true },
    subcategory: { type: String, default: '' },
    subsubcategory: { type: String, default: '' },

    // Pricing
    price: { type: Number, required: true },
    listPrice: { type: Number, required: true },

    // Inventory & Availability
    countInStock: { type: Number, required: true },
    variants: { type: [variantSchema], default: [] }, // NEW

    isPublished: { type: Boolean, required: true, default: false },

    // Ratings & Reviews
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
   
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],
    ratingDistribution: [{ rating: Number, count: Number }],
    
    // Sales & Marketing
    numSales: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },

    // Media
    images: { type: [String], required: true },
    variantImages: { type: Map, of: [String], default: {} },

    // Description & SEO
    description: { type: String, trim: true },
    keywords: { type: [String], validate: [(v: string[]) => v.length <= 10, 'Max 10 keywords'], default: [] },
  },
  { timestamps: true }
)

// Pre-save hook to auto-generate slugs
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name)
  }
  if (this.isModified('category')) {
    this.categorySlug = slugify(this.category)
  }
  if (this.isModified('tags') && this.tags) {
    this.tagsSlug = this.tags.map((tag) => slugify(tag))
  }
  next()
})

// Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
})

const ProductModel = (models.Product as Model<Product>) || model<Product>('Product', productSchema)
export default ProductModel
