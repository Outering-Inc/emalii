import mongoose, { Schema } from 'mongoose'

const paymentJobSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, required: true },
    providerReference: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    paymentData: { type: Schema.Types.Mixed, required: true },

    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED'],
      default: 'PENDING',
    },

    attempts: { type: Number, default: 0 },
    lastError: String,
  },
  { timestamps: true }
)

// 🔒 Prevent duplicate jobs
paymentJobSchema.index(
  { orderId: 1, providerReference: 1 },
  { unique: true }
)

export default mongoose.models.PaymentJob ||
  mongoose.model('PaymentJob', paymentJobSchema)
