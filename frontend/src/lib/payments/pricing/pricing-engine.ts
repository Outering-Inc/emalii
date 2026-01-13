import { OrderItem, ShippingAddress } from '@/src/types'
import { calcDeliveryDateAndPrice } from '@/src/lib/actions/orderActions'
import { round2 } from '@/src/lib/utils/utils'

/* ---------------------------------------------
   Input / Output Types
---------------------------------------------- */

export interface CartPriceEngineInput {
  items: OrderItem[]
  shippingAddress?: ShippingAddress
  deliveryDateIndex?: number
  discountPercent?: number
}

export interface CartPriceEngineOutput {
  listItemsPrice: number
  discount: number
  itemsPrice: number
  shippingPrice: number
  taxPrice: number
  totalPrice: number
  qualifiesForFreeShipping: boolean
  remainingForFreeShipping: number
}

/* ---------------------------------------------
   Amazon-Style Cart Price Engine
---------------------------------------------- */

export async function calculateCartPrices({
  items,
  shippingAddress,
  deliveryDateIndex,
  discountPercent = 0,
}: CartPriceEngineInput): Promise<CartPriceEngineOutput> {
  /* 1️⃣ Base delivery pricing (infra layer) */
  const base = await calcDeliveryDateAndPrice({
    items,
    shippingAddress,
    deliveryDateIndex,
  })

  /* 2️⃣ List price (before discounts) */
  const listItemsPrice = round2(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  /* 3️⃣ Discount */
  const discount =
    discountPercent > 0
      ? round2((listItemsPrice * discountPercent) / 100)
      : 0

  /* 4️⃣ Items price (after discount) */
  const itemsPrice = round2(listItemsPrice - discount)

  /* 5️⃣ Free-shipping threshold (from delivery config) */
  const freeShippingMinPrice =
    base.availableDeliveryDates?.[base.deliveryDateIndex]
      ?.freeShippingMinPrice ?? 0

  const qualifiesForFreeShipping =
    freeShippingMinPrice > 0 && itemsPrice >= freeShippingMinPrice

  const remainingForFreeShipping = qualifiesForFreeShipping
    ? 0
    : round2(Math.max(freeShippingMinPrice - itemsPrice, 0))

  /* 6️⃣ Shipping (Amazon rule: free shipping overrides delivery price) */
  const rawShippingPrice = base.shippingPrice ?? 0

  const shippingPrice = qualifiesForFreeShipping ? 0 : rawShippingPrice

  /* 7️⃣ Tax (computed on discounted items price) */
  const taxPrice = shippingAddress
    ? round2(itemsPrice * 0.16)
    : 0

  /* 8️⃣ Total */
  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

  /* 9️⃣ Return ONLY pricing data */
  return {
    listItemsPrice,
    discount,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    qualifiesForFreeShipping,
    remainingForFreeShipping,
  }
}