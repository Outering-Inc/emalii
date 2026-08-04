'use server'

import { connectToDatabase } from '../db/dbConnect'
import OrderModel from '../db/models/orderModel'
import { formatError } from '../utils/utils'
import { cache } from 'react'
import Stripe from 'stripe'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-08-27.basil',
})

/**
 * 🔹 Create Stripe PaymentIntent
 * - Generates a PaymentIntent for an order
 * - Saves PaymentIntent ID to order.paymentResult
 * - Returns clientSecret for frontend PaymentElement
 */
export const createStripePayment = cache(async (orderId: string) => {
  await connectToDatabase()

  try {
    // 1️⃣ Load Order from DB
    const order = await OrderModel.findById(orderId)
    if (!order) throw new Error('Order not found')

    // 2️⃣ Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.ceil(order.totalPrice * 100), // Convert dollars to cents
      currency: 'usd',
      metadata: { orderId: order._id.toString() }, // Link PaymentIntent to order
    })

    // 3️⃣ Save PaymentIntent ID in order
    order.paymentResult = {
      id: paymentIntent.id,
      email_address: '',
      status: 'PENDING',
      pricePaid: 0,
    }
    await order.save()

    // 4️⃣ Return clientSecret to frontend
    return {
      success: true,
      message: 'Stripe PaymentIntent created successfully',
      data: {
        orderId: order._id.toString(),
        paymentMethod: 'STRIPE',
        checkoutId: paymentIntent.id,
        checkoutUrl: '', // Optional frontend: you can pass client_secret
        clientSecret: paymentIntent.client_secret,
        status: 'PENDING',
      },
    }
  } catch (err) {
    return { success: false, message: formatError(err) }
  }
})
