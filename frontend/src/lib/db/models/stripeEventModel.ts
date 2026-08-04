import { Schema, model, models } from 'mongoose'

const stripeEventSchema = new Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

export default models.StripeEvent ||
  model('StripeEvent', stripeEventSchema)
