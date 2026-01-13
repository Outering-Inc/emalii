'use client'

import { useEffect } from 'react'
import useCartStore from '@/src/hooks/stores/use-cart-store'
import useSettingStore from '@/src/hooks/stores/use-setting-store'

export function useCartPrice() {
  const {
    cart: { items },
    setPricing,
  } = useCartStore()

  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  // 1️⃣ Base item price
  const listItemsPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  // 2️⃣ Discount
  const DISCOUNT_PERCENT = 10
  const discount =
    DISCOUNT_PERCENT > 0
      ? Math.round((listItemsPrice * DISCOUNT_PERCENT) / 100)
      : 0

  const itemsPrice = listItemsPrice - discount

  // 3️⃣ Shipping
  const shippingPrice =
    itemsPrice >= freeShippingMinPrice ? 0 : 500 // example

  // 4️⃣ Tax
  const TAX_RATE = 0.16
  const taxPrice = Math.round(itemsPrice * TAX_RATE)

  // 5️⃣ Total
  const totalPrice = itemsPrice + shippingPrice + taxPrice

  // 🔥 Sync prices into cart store
  useEffect(() => {
    setPricing({
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
    })
  }, [itemsPrice, shippingPrice, taxPrice, totalPrice, setPricing])

  return {
    items,
    listItemsPrice,
    discount,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    freeShippingMinPrice,
    qualifiesForFreeShipping: itemsPrice >= freeShippingMinPrice,
  }
}
