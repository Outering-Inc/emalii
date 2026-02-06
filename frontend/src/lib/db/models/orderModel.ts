import { OrderInput } from '@/src/types'
import { Document, Model, model, models, Schema } from 'mongoose'
import { PaymentState } from '@/src/lib/payments/state-machine/paymentState'

export interface Order extends Document, OrderInput {
  _id: string
  createdAt: Date
  updatedAt: Date
  isPaid: boolean
  paymentState: PaymentState

  mpesaTransactionId?: string
  mpesaPaymentStatus?: string
}

const orderSchema = new Schema<Order>(
  {
    user: {
      type: Schema.Types.ObjectId as unknown as typeof String,
      ref: 'User',
      required: true,
    },

    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        variantId: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        clientId: { type: String, required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        category: { type: String, required: true },
        price: { type: Number, required: true },
        countInStock: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: String },
        color: { type: String },
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

    paymentMethod: { type: String, required: true },

    paymentResult: {
      id: String,
      status: String,
      email_address: String,
    },

    paymentState: {
      type: String,
      enum: Object.values(PaymentState),
      default: PaymentState.INITIATED,
      index: true,
    },

    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true },
    taxPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    // 🔒 Derived flags (AUTO-SYNCED)
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },

    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },

    mpesaTransactionId: { type: String },
    mpesaPaymentStatus: { type: String },

    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)


// ===================================================
// 🔥 AUTO-SYNC LOGIC (SOURCE OF TRUTH = paymentState)
// ===================================================
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

    case PaymentState.DISPUTED:
      // money might be held → preserve isPaid
      break

    default:
      break
  }

  next()
})

const OrderModel =
  (models.Order as Model<Order>) || model<Order>('Order', orderSchema)

export default OrderModel
