/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrderInput } from '@/src/types'
import { Document, Model, model, models, Schema } from 'mongoose'
import { PaymentState } from '@/src/lib/payments/state-machine/paymentState'

export interface Order extends Document, OrderInput {
  _id: string
  createdAt: Date
  updatedAt: Date

  paymentMethod: 'MPESA' | 'STRIPE' | 'PAYPAL' | 'CASH'
  paymentState: PaymentState

  isPaid: boolean
  paidAt?: Date

  /* ✅ SINGLE SOURCE OF PAYMENT ID */
  paymentReference?: {
    provider: 'MPESA' | 'STRIPE' | 'PAYPAL' | 'CASH'
    transactionId: string
    status?: string
    raw?: any
  }

  /* ⚠️ OPTIONAL (legacy / debugging only) */
  mpesaTransactionId?: string
  mpesaPaymentStatus?: string
  stripeTransactionId?: string
  paypalTransactionId?: string

  isDelivered: boolean
  deliveredAt?: Date
}

const orderSchema = new Schema<Order>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId, required: true },
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: String,
        color: String,
      },
    ],

    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
      province: { type: String, required: true },
      phone: { type: String, required: true },
    },

    expectedDeliveryDate: { type: Date, required: true },

    paymentMethod: {
      type: String,
      enum: ['MPESA', 'STRIPE', 'PAYPAL', 'CASH'],
      required: true,
      index: true,
    },

    paymentState: {
      type: String,
      enum: Object.values(PaymentState),
      default: PaymentState.INITIATED,
      index: true,
    },

    /* ✅ NORMALIZED TRANSACTION */
    paymentReference: {
      provider: {
        type: String,
        enum: ['MPESA', 'STRIPE', 'PAYPAL', 'CASH'],
      },
      transactionId: {
        type: String,
        index: true,
      },
      status: String,
      raw: Schema.Types.Mixed,
    },

    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    isPaid: { type: Boolean, required: true, default: false, index: true },
    paidAt: Date,

    isDelivered: { type: Boolean, required: true, default: false, index: true },
    deliveredAt: Date,

    /* ⚠️ Legacy */
    mpesaTransactionId: String,
    mpesaPaymentStatus: String,
    stripeTransactionId: String,
    paypalTransactionId: String,

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

/* 🔥 STATE MACHINE SYNC */
orderSchema.pre('save', function (next) {
  if (!this.isModified('paymentState')) return next()

  switch (this.paymentState) {
    case PaymentState.CAPTURED:
      this.isPaid = true
      this.paidAt = this.paidAt ?? new Date()
      break

    case PaymentState.REFUNDED:
    case PaymentState.REVERSED:
      this.isPaid = false
      this.paidAt = undefined
      break
  }

  next()
})

const OrderModel =
  (models.Order as Model<Order>) || model<Order>('Order', orderSchema)

export default OrderModel
