'use client'

import { useEffect, useState } from 'react'
import useCartStore from '@/src/hooks/stores/use-cart-store'
import { calculateCartPrices } from '@/src/lib/payments/pricing/pricing-engine'
//import { calculateCartPrices } from '@/src/lib/pricing/cartPriceEngine'

export function useCartPrice() {
  const {
    cart: { items, shippingAddress, deliveryDateIndex },
    setPricing,
  } = useCartStore()

  const [loading, setLoading] = useState(false)

  const [derived, setDerived] = useState({
    listItemsPrice: 0,
    discount: 0,
    qualifiesForFreeShipping: false,
    remainingForFreeShipping: 0,
  })

  useEffect(() => {
    if (!items.length) return

    const run = async () => {
      setLoading(true)

      const pricing = await calculateCartPrices({
        items,
        shippingAddress,
        deliveryDateIndex,
        discountPercent: 10, // 🔥 single source
      })

      // Persist only totals
      setPricing({
        itemsPrice: pricing.itemsPrice,
        shippingPrice: pricing.shippingPrice,
        taxPrice: pricing.taxPrice,
        totalPrice: pricing.totalPrice,
      })

      // Keep derived values in hook
      setDerived({
        listItemsPrice: pricing.listItemsPrice,
        discount: pricing.discount,
        qualifiesForFreeShipping: pricing.qualifiesForFreeShipping,
        remainingForFreeShipping: pricing.remainingForFreeShipping,
      })

      setLoading(false)
    }

    run()
  }, [items, shippingAddress, deliveryDateIndex, setPricing])

  const cart = useCartStore((s) => s.cart)

  return {
    loading,

    // items
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),

    // prices
    listItemsPrice: derived.listItemsPrice,
    discount: derived.discount,
    itemsPrice: cart.itemsPrice,
    shippingPrice: cart.shippingPrice,
    taxPrice: cart.taxPrice,
    totalPrice: cart.totalPrice,

    // UX helpers
    qualifiesForFreeShipping: derived.qualifiesForFreeShipping,
    remainingForFreeShipping: derived.remainingForFreeShipping,
  }
}
