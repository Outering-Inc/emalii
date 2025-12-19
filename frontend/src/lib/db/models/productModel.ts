import { Document, Model, model, models, Schema } from 'mongoose'
import { ProductInput } from '@/src/types'

export interface Product extends Document, ProductInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<Product>(
  {
     // Basic Info
    name: { type: String, required: true,},
    slug: {  type: String,  required: true,   unique: true, },  
    brand: { type: String, required: true,  },

     // Product Attributes
    tags: { type: [String], default: ['new arrival'] },
    colors: { type: [String], default: ['White', 'Red', 'Black'] },
    sizes: { type: [String], default: ['S', 'M', 'L'] },
    attributes: { type: Map, of: String }, // e.g., {screenSize: "42inch", resolution: "4K"}

     // Category hierarchy
    category: {   type: String,required: true, }, // e.g., Electronics
    subcategory: { type: String,  default: '' }, // e.g., TV 
    subsubcategory: { type: String,  default: ''}, // e.g., Smart 
    
    // Pricing
    price: {type: Number,required: true,},
    listPrice: { type: Number, required: true, }, 
    
            
    // Inventory & Availability          
    countInStock: { type: Number, required: true,  },
    isPublished: { type: Boolean,   required: true,default: false,},
    
         
    // Ratings & Reviews
    avgRating: { type: Number,required: true,default: 0,},
    numReviews: { type: Number,required: true,default: 0,},
    ratingDistribution: [
      {
        rating: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
      },
    ],  
     reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Review',
        default: [],
      },
    ],  
      

   // Sales & Marketing             
    numSales: { type: Number, required: true,default: 0,},
    isFeatured: { type: Boolean, required: true, default: false, },
    featuredOrder: { type: Number, default: 0 },

    // Media
    images: { type: [String], required: true,  },
     
    // Description & SEO
    description: {  type: String,trim: true,},
     //seoTitle: { type: String, default: '' },
    //seoDescription: { type: String, default: '' },


     // Optional: Vendor/Marketplace info
   // vendor: { type: String, default: '' },
    //sku: { type: String, default: '' },
    //barcode: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
)

// ✅ Add a compound text index for search
// This lets you search across multiple fields efficiently
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
})

// Avoid recompiling model in Next.js hot reload
const ProductModel =
  (models.Product as Model<Product>) ||
  model<Product>('Product', productSchema)

export default ProductModel