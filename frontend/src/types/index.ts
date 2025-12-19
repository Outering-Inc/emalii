import { MpesaInputSchema } from "@/src/lib/validation/mpesa";
import { 
  CarouselSchema,
  CartSchema, 
  DeliveryDateSchema, 
  OrderInputSchema, 
  OrderItemSchema, 
  PaymentMethodSchema, 
  ProductInputSchema, 
  ProductUpdateSchema, 
  ReviewInputSchema, 
  SettingInputSchema, 
  ShippingAddressSchema, 
  SiteCurrencySchema, 
  SiteLanguageSchema, 
  UserInputSchema, 
  UserNameSchema, 
  UserSignInSchema,
  UserSignUpSchema,
  WebPageInputSchema
 } from "@/src/lib/validation/validator";
import { z } from "zod";


// ------------------ Generic App Data ------------------
export type Data = {
  settings: SettingInput[]
  users: UserInput[]
  products: ProductInput[]
  webPages: WebPageInput[]
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


// ------------------ Products ------------------
export type ProductInput = z.infer<typeof ProductInputSchema> & {
  subcategory?: string
  subsubcategory?: string
  isFeatured?: boolean
  featuredOrder?: number
  attributes?: Record<string, string>
}

export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>

// ------------------ Users ------------------
export type UserInput = z.infer<typeof UserInputSchema>
export type UserSignIn = z.infer<typeof UserSignInSchema>
export type UserSignUp = z.infer<typeof UserSignUpSchema>
export type UserName = z.infer<typeof UserNameSchema>

// ------------------ Mpesa ------------------
export type MpesaTransactionInput = z.infer<typeof MpesaInputSchema>

// ------------------ Web Pages ------------------
export type WebPageInput = z.infer<typeof WebPageInputSchema>

// ------------------ Settings & Others ------------------
export type CarouselInput = z.infer<typeof CarouselSchema>
export type SettingInput = z.infer<typeof SettingInputSchema>
export type ClientSetting = SettingInput & {
  currency: string
}
export type SiteLanguage = z.infer<typeof SiteLanguageSchema>
export type SiteCurrency = z.infer<typeof SiteCurrencySchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type DeliveryDate = z.infer<typeof DeliveryDateSchema>
