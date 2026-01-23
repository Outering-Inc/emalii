'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, OrderItem, ShippingAddress } from '@/src/types'
import { calcDeliveryDateAndPrice } from '@/src/lib/actions/orderActions'

/* ---------------- INITIAL STATE ---------------- */

const initialState: Cart = {
  items: [],
  itemsPrice: 0,
  totalPrice: 0,
  taxPrice: 0,
  shippingPrice: 0,
  paymentMethod: 'PayPal',
  shippingAddress: {
    fullName: '',
    street: '',
    city: '',
    postalCode: '',
    province: '',
    phone: '',
    country: '',
  },
  deliveryDateIndex: 0,
}

/* ---------------- STORE INTERFACE ---------------- */

interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => Promise<void>
  clearCart: () => void
  setShippingAddress: (address: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  setPricing: (pricing: Partial<Cart>) => void
  init: () => void
}

/* ---------------- CART STORE ---------------- */

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialState,

      /* ---------------- ADD ITEM ---------------- */

      addItem: async (item, quantity) => {
        const { items, shippingAddress } = get().cart

        // ✅ MATCH BY VARIANT ID (AMAZON STYLE)
        const existItem = items.find(
          x => x.variantId === item.variantId
        )

        // Stock validation
        if (existItem) {
          if (existItem.countInStock < existItem.quantity + quantity) {
            throw new Error('Not enough items in stock')
          }
        } else {
          if (item.countInStock < quantity) {
            throw new Error('Not enough items in stock')
          }
        }

        const updatedItems = existItem
          ? items.map(x =>
              x.variantId === item.variantId
                ? { ...x, quantity: x.quantity + quantity }
                : x
            )
          : [...items, { ...item, quantity }]

        set({
          cart: {
            ...get().cart,
            items: updatedItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedItems,
              shippingAddress,
            })),
          },
        })

        const foundItem = updatedItems.find(
          x => x.variantId === item.variantId
        )

        if (!foundItem) {
          throw new Error('Item not found in cart')
        }

        return foundItem.clientId
      },

      /* ---------------- UPDATE ITEM ---------------- */

      updateItem: async (item, quantity) => {
        const { items, shippingAddress } = get().cart

        const existItem = items.find(
          x => x.variantId === item.variantId
        )

        if (!existItem) return

        if (quantity > existItem.countInStock) {
          throw new Error('Not enough items in stock')
        }

        const updatedItems = items.map(x =>
          x.variantId === item.variantId
            ? { ...x, quantity }
            : x
        )

        set({
          cart: {
            ...get().cart,
            items: updatedItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedItems,
              shippingAddress,
            })),
          },
        })
      },

      /* ---------------- REMOVE ITEM ---------------- */

      removeItem: async (item) => {
        const { items, shippingAddress } = get().cart

        const updatedItems = items.filter(
          x => x.variantId !== item.variantId
        )

        set({
          cart: {
            ...get().cart,
            items: updatedItems,
            ...(await calcDeliveryDateAndPrice({
              items: updatedItems,
              shippingAddress,
            })),
          },
        })
      },

      /* ---------------- CLEAR CART ---------------- */

      clearCart: () => {
        set({ cart: { ...get().cart, items: [] } })
      },

      /* ---------------- SHIPPING ADDRESS ---------------- */

      setShippingAddress: async (shippingAddress) => {
        const { items } = get().cart

        set({
          cart: {
            ...get().cart,
            shippingAddress,
            ...(await calcDeliveryDateAndPrice({
              items,
              shippingAddress,
            })),
          },
        })
      },

      /* ---------------- PAYMENT METHOD ---------------- */

      setPaymentMethod: (paymentMethod) => {
        set({
          cart: { ...get().cart, paymentMethod },
        })
      },

      /* ---------------- DELIVERY DATE ---------------- */

      setDeliveryDateIndex: async (index) => {
        const { items } = get().cart

        set({
          cart: {
            ...get().cart,
            ...(await calcDeliveryDateAndPrice({
              items,
              deliveryDateIndex: index,
            })),
          },
        })
      },

      /* ---------------- PRICING (SERVER-DRIVEN) ---------------- */

      setPricing: (pricing) => {
        set({
          cart: {
            ...get().cart,
            ...pricing,
          },
        })
      },

      /* ---------------- RESET ---------------- */

      init: () => set({ cart: initialState }),
    }),
    {
      name: 'cart-store',
    }
  )
)

export default useCartStore
