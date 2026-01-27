// src/lib/db/models/mpesaModel.ts
import { Schema, model, models, Document, Model, Types } from 'mongoose'
import type { MpesaCallback } from '@/src/types/mpesa'

export interface MpesaTransactionInput {
  phone: string
  amount: number
  mpesaReceiptNumber?: string
  transactionDate?: string
  resultCode?: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  resultDesc?: string
  merchantRequestId?: string
  checkoutRequestId?: string
  user: Types.ObjectId
  orderId: Types.ObjectId
  paymentData?: MpesaCallback
}

export interface IMpesaTransaction
  extends Document<Types.ObjectId>,
    MpesaTransactionInput {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const mpesaTransactionSchema = new Schema<IMpesaTransaction>(
  {
    phone: { type: String, required: true },
    amount: { type: Number, required: true },

    mpesaReceiptNumber: String,
    transactionDate: String,
    resultCode: Number,
    resultDesc: String,

    merchantRequestId: String,
    checkoutRequestId: String,

    status: {
      type: String,
      enum: ['PENDING', 'SUCCESS', 'FAILED'],
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    paymentData: Object,
  },
  { timestamps: true }
)

/**
 * 🔒 ONE pending transaction per order
 */
mpesaTransactionSchema.index(
  { orderId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'PENDING' },
  }
)

const MpesaTransaction: Model<IMpesaTransaction> =
  models.MpesaTransaction ||
  model<IMpesaTransaction>('MpesaTransaction', mpesaTransactionSchema)

export default MpesaTransaction
