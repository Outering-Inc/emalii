import { MpesaInputSchema } from "@/src/lib/validation/mpesa";
import { 
  CartSchema, 
  OrderInputSchema, 
  OrderItemSchema, 
  ProductInputSchema, 
  ProductUpdateSchema, 
  ReviewInputSchema, 
  ShippingAddressSchema, 
  UserInputSchema, 
  UserNameSchema, 
  UserSignInSchema,
  UserSignUpSchema,
  UserUpdateSchema
 } from "@/src/lib/validation/validator";
import { z } from "zod";


// ------------------ Generic App Data ------------------
export type Data = {
  users: UserInput[]
  products: ProductInput[]
  reviews: {
    title: string
    rating: number
    comment: string
  }[]
  headerMenus: {
    name: string
    href: string
  }[]
  carousels: {
    image: string
    url: string
    title: string
    buttonCaption: string
    isPublished: boolean
  }[]
}

// ------------------ Reviews ------------------
export type ReviewInput = z.infer<typeof ReviewInputSchema>
export type ReviewDetails = ReviewInput & {
  _id: string
  createdAt: string
  user: {
    name: string
  }
}






// ------------------ Products ------------------
export type ProductInput = z.infer<typeof ProductInputSchema>
export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>
 
 


// ------------------ Orders ------------------
export type OrderInput = z.infer<typeof OrderInputSchema>

export type OrderList = OrderInput & {
  _id: string
  user?: {
    _id?: string
    name: string
    email?: string
  } | null
  createdAt: string | Date
  paidAt?: string | Date | null
  deliveredAt?: string | Date | null
  totalPrice: number
  isPaid: boolean
  isDelivered: boolean
  items?: z.infer<typeof OrderItemSchema>[] // optional: extendable
  shippingAddress?: z.infer<typeof ShippingAddressSchema>
  paymentMethod?: string
  itemsPrice?: number
  taxPrice?: number
  shippingPrice?: number
}

export type OrderItem = z.infer<typeof OrderItemSchema>
export type Cart = z.infer<typeof CartSchema>
export type ShippingAddress = z.infer<typeof ShippingAddressSchema>

// ------------------ Users ------------------
export type UserInput = z.infer<typeof UserInputSchema>
export type UserEditFormType = z.infer<typeof UserUpdateSchema>;
export type UserUpdateInput = Partial<UserInput> & { _id: string };

export type UserSignIn = z.infer<typeof UserSignInSchema>
export type UserSignUp = z.infer<typeof UserSignUpSchema>
export type UserName = z.infer<typeof UserNameSchema>

// ------------------ Mpesa ------------------
export type MpesaTransactionInput = z.infer<typeof MpesaInputSchema>



// ------------------Product Default Values ------------------
export const ProductUpdateDefaultValues: ProductEditFormType = {
  _id: "",
  name: "",
  slug: "",
  price: 0,
  countInStock: 0,
  description: "",
  images: [],
};

export type ProductEditFormType = z.infer<typeof ProductUpdateSchema>;
export type ProductEditType = z.infer<typeof ProductUpdateSchema>;


export const ProductDefaultValues: ProductEditType =
  process.env.NODE_ENV === 'development'
    ? {
        _id: '',
        name: 'Sample Product',
        slug: 'sample-product',
        category: 'Sample Category',
        images: ['/images/p11-1.jpg'],
        brand: 'Sample Brand',
        description: 'This is a sample description of the product.',
        price: 99.99,
        listPrice: 0,
        countInStock: 15,
        numReviews: 0,
        avgRating: 0,
        numSales: 0,
        isPublished: false,
        tags: [],
        sizes: [],
        colors: [],
        ratingDistribution: [],
        reviews: [],
      }
    : {
        _id: '',
        name: '',
        slug: '',
        category: '',
        images: [],
        brand: '',
        description: '',
        price: 0,
        listPrice: 0,
        countInStock: 0,
        numReviews: 0,
        avgRating: 0,
        numSales: 0,
        isPublished: false,
        tags: [],
        sizes: [],
        colors: [],
        ratingDistribution: [],
        reviews: [],
      }
