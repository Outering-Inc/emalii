'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Cart, OrderItem, ShippingAddress } from '@/src/types'
import { calcDeliveryDateAndPrice } from '@/src/lib/services/orderService'

// -----------------------------
// Initial cart state
// -----------------------------
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

// -----------------------------
// Cart store interface
// -----------------------------
interface CartState {
  cart: Cart
  addItem: (item: OrderItem, quantity: number) => Promise<string>
  updateItem: (item: OrderItem, quantity: number) => Promise<void>
  removeItem: (item: OrderItem) => Promise<void>
  clearCart: () => void
  setShippingAddress: (address: ShippingAddress) => Promise<void>
  setPaymentMethod: (paymentMethod: string) => void
  setDeliveryDateIndex: (index: number) => Promise<void>
  init: () => void
}

// -----------------------------
// Cart store
// -----------------------------
const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: initialState,

      // -----------------------------
      // Add item
      // -----------------------------
      addItem: async (item, quantity) => {
        const { items, shippingAddress } = get().cart
        const existItem = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )

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
          ? items.map((x) =>
              x.product === item.product &&
              x.color === item.color &&
              x.size === item.size
                ? { ...existItem, quantity: existItem.quantity + quantity }
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
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!foundItem) throw new Error('Item not found in cart')
        return foundItem.clientId
      },

      // -----------------------------
      // Update item quantity
      // -----------------------------
      updateItem: async (item, quantity) => {
        const { items, shippingAddress } = get().cart
        const exist = items.find(
          (x) =>
            x.product === item.product &&
            x.color === item.color &&
            x.size === item.size
        )
        if (!exist) return

        const updatedItems = items.map((x) =>
          x.product === item.product &&
          x.color === item.color &&
          x.size === item.size
            ? { ...exist, quantity }
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

      // -----------------------------
      // Remove item
      // -----------------------------
      removeItem: async (item) => {
        const { items, shippingAddress } = get().cart
        const updatedItems = items.filter(
          (x) =>
            x.product !== item.product ||
            x.color !== item.color ||
            x.size !== item.size
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

      // -----------------------------
      // Clear cart
      // -----------------------------
      clearCart: () => {
        set({ cart: { ...get().cart, items: [] } })
      },

      // -----------------------------
      // Set shipping address
      // -----------------------------
      setShippingAddress: async (shippingAddress) => {
        const { items } = get().cart
        set({
          cart: {
            ...get().cart,
            shippingAddress,
            ...(await calcDeliveryDateAndPrice({ items, shippingAddress })),
          },
        })
      },

      // -----------------------------
      // Set payment method
      // -----------------------------
      setPaymentMethod: (paymentMethod) => {
        set({ cart: { ...get().cart, paymentMethod } })
      },

      // -----------------------------
      // Set delivery date index
      // -----------------------------
      setDeliveryDateIndex: async (index) => {
        const { items } = get().cart
        set({
          cart: {
            ...get().cart,
            ...(await calcDeliveryDateAndPrice({ items, deliveryDateIndex: index })),
          },
        })
      },

      // -----------------------------
      // Reset cart
      // -----------------------------
      init: () => set({ cart: initialState }),
    }),
    { name: 'cart-store' }
  )
)

export default useCartStore
