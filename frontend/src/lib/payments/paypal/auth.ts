const base =
  process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'



export async function generatePayPalAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env

  if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
    throw new Error('Missing PayPal credentials in environment variables.')
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64')

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'post',
    body: 'grant_type=client_credentials',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
  })

  const jsonData = await handleResponse(response)
  return jsonData.access_token
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleResponse(response: any) {
  if (response.status === 200 || response.status === 201) {
    return response.json()
  }

  const errorText = await response.text()
  console.error('PayPal API Error:', response.status, errorText)
  throw new Error(`PayPal API Error ${response.status}: ${errorText}`)
}