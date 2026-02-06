import { Schema, model, models } from 'mongoose'

const schema = new Schema({
  provider: { type: String, required: true },
  eventId: { type: String, required: true, unique: true },
  payload: Object,
  receivedAt: { type: Date, default: Date.now },
})

export default models.WebhookEvent || model('WebhookEvent', schema)
