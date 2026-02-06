import WebhookEvent from '@/src/lib/db/models/webhookEventModel'

export async function assertNotReplayed(
  provider: string,
  eventId: string,
  payload: unknown
) {
  await WebhookEvent.create({
    provider,
    eventId,
    payload,
  })
}
