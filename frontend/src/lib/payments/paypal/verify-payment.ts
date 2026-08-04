
const base =
  process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

/* ===============================
   Types
================================= */

export interface PayPalCapture {
  id: string
  status: string
  amount: {
    value: string
    currency_code: string
  }
}

export interface PayPalCaptureResponse {
  id: string
  status: string
  final_capture: boolean
  amount: {
    currency_code: string
    value: string
  }
  seller_receivable_breakdown?: {
    gross_amount?: {
      currency_code: string
      value: string
    }
    paypal_fee?: {
      currency_code: string
      value: string
    }
    net_amount?: {
      currency_code: string
      value: string
    }
    total_refunded_amount?: {
      currency_code: string
      value: string
    }
  }
  payee?: {
    email_address?: string
    merchant_id?: string
  }
}


/* ===============================
   Verify Payment (CAPTURE LEVEL)
================================= */

export async function verifyPayPalPayment(
  captureId: string
): Promise<PayPalCaptureResponse> {
  if (!captureId) {
    throw new Error('Missing PayPal captureId')
  }

  const accessToken = await generateAccessToken()

  const response = await fetch(
    `${base}/v2/payments/captures/${captureId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    throw new Error(
      `PayPal capture verification failed: ${response.status}`
    )
  }

  const data: PayPalCaptureResponse = await response.json()

  return data
}

/* ===============================
   Access Token
================================= */

async function generateAccessToken(): Promise<string> {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env

  if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
    throw new Error('Missing PayPal credentials')
  }

  const auth = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`
  ).toString('base64')

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`)
  }

  const json: { access_token: string } = await response.json()

  return json.access_token
}
