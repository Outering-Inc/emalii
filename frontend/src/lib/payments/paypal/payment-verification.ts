/* eslint-disable @typescript-eslint/no-explicit-any */
const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

export async function verifyPayPalPayment(paymentData: { orderID: string }): Promise<boolean> {
  try {
    const accessToken = await generateAccessToken()

    const response = await fetch(`${base}/v2/checkout/orders/${paymentData.orderID}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    // Check if order is completed
    if (data.status === 'COMPLETED') return true

    console.error('PayPal payment not completed:', data)
    return false
  } catch (err: any) {
    console.error('Error verifying PayPal payment:', err.message)
    return false
  }
}

async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env
  if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
    throw new Error('Missing PayPal credentials')
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64')

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  const json = await response.json()
  return json.access_token
}
