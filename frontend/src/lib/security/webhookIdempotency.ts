import webhookEventModel from '../db/models/webhookEventModel'
import { redis } from './redis'

export async function guardWebhookReplay(
  provider: 'paypal' | 'stripe',
  eventId: string
) {
  const redisKey = `webhook:${provider}:${eventId}`

  // fast path
  if (await redis.get(redisKey)) {
    return false
  }

  const exists = await webhookEventModel.findOne({
    provider,
    eventId,
  })

  if (exists) {
    await redis.set(redisKey, '1', { ex: 60 * 60 })
    return false
  }

  await webhookEventModel.create({
    provider,
    eventId,
    receivedAt: new Date(),
  })

  await redis.set(redisKey, '1', { ex: 60 * 60 })

  return true
}
