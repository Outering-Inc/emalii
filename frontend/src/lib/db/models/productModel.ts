import { Document, Model, model, models, Schema } from 'mongoose'
import { ProductInput } from '@/src/types'
import { slugify } from '@/src/lib/utils/utils' // your slug function

export interface Product extends Document, ProductInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  categorySlug?: string
  tagsSlug?: string[]
}

const productSchema = new Schema<Product>(
  {
    // Basic Info
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    brand: { type: String, required: true },

    // Product Attributes
    tags: { type: [String], default: ['new-arrival'] },
    tagsSlug: { type: [String], index: true }, // normalized for queries
    colors: { type: [String], default: ['White', 'Red', 'Black'] },
    sizes: { type: [String], default: ['S', 'M', 'L'] },
    attributes: { type: Map, of: String },

    // Category hierarchy
    category: { type: String, required: true },
    categorySlug: { type: String, index: true }, // normalized for queries
    subcategory: { type: String, default: '' },
    subsubcategory: { type: String, default: '' },

    // Pricing
    price: { type: Number, required: true },
    listPrice: { type: Number, required: true },

    // Inventory & Availability
    countInStock: { type: Number, required: true },
    isPublished: { type: Boolean, required: true, default: false },

    // Ratings & Reviews
    avgRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    ratingDistribution: [
      { rating: Number, count: Number }
    ],
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review', default: [] }],

    // Sales & Marketing
    numSales: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },

    // Media
    images: { type: [String], required: true },

    // Description & SEO
    description: { type: String, trim: true },
  },
  { timestamps: true }
)

// ✅ Pre-save hook to auto-generate slugs
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

// ✅ Text index for search
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
})

// Prevent model recompilation in Next.js
const ProductModel = (models.Product as Model<Product>) || model<Product>('Product', productSchema)

export default ProductModel
