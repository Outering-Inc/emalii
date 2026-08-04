import mongoose, { Schema, Document } from 'mongoose'

export interface PayPalEventDocument extends Document {
  eventId: string
  type: string
  createdAt: Date
}

const paypalEventSchema = new Schema<PayPalEventDocument>({
  eventId: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.PayPalEvent ||
  mongoose.model<PayPalEventDocument>(
    'PayPalEvent',
    paypalEventSchema
  )
