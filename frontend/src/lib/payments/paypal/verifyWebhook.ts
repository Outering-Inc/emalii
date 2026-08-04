import { NextRequest } from 'next/server'
import { generatePayPalAccessToken } from './auth'

const base =
  process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

export async function verifyPayPalWebhookSignature(
  req: NextRequest,
  rawBody: string
): Promise<boolean> {
  const token = await generatePayPalAccessToken()

  const res = await fetch(
    `${base}/v1/notifications/verify-webhook-signature`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'),
        cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_sig: req.headers.get(
          'paypal-transmission-sig'
        ),
        transmission_time: req.headers.get(
          'paypal-transmission-time'
        ),
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(rawBody),
      }),
    }
  )

  const data = await res.json()
  return data.verification_status === 'SUCCESS'
}
