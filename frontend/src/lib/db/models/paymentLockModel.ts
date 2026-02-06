import { Schema, model, models } from 'mongoose'

export interface PaymentLock {
  orderId: string
  providerReference: string
  createdAt: Date
}

const paymentLockSchema = new Schema<PaymentLock>({
  orderId: { type: String, required: true },
  providerReference: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }, // auto-clean after 24h
})

// 🚨 This is the magic
paymentLockSchema.index(
  { orderId: 1, providerReference: 1 },
  { unique: true }
)

export const PaymentLockModel =
  models.PaymentLock || model('PaymentLock', paymentLockSchema)
