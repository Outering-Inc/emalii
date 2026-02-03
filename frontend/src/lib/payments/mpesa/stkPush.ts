// lib/payments/mpesa/stkPush.ts
import { normalizeKenyanPhone } from '../../utils/mpesa'
import { getMpesaAccessToken } from './safaricom'

type STKParams = {
  phoneNumber: string
  orderId: string
  amount: number
}

export async function initiateStkPush({
  phoneNumber,
  amount,
  orderId,
}: STKParams) {
  try {
    // 1️⃣ Normalize phone number
    const normalizedPhone = normalizeKenyanPhone(phoneNumber)
    console.log('📞 Normalized Phone:', normalizedPhone)

    // 2️⃣ Get access token
    const token = await getMpesaAccessToken()
    console.log('🔑 Access Token:', token)

    // 3️⃣ Timestamp for password
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
    console.log('⏰ Timestamp:', timestamp)

    // 4️⃣ Environment variables
    const shortcode = process.env.MPESA_SHORTCODE
    const passkey = process.env.MPESA_PASSKEY
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL

    if (!shortcode || !passkey || !baseUrl) {
      throw new Error('❌ Missing environment variables for MPESA integration')
    }

    // 5️⃣ Password generation
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64')

    // 6️⃣ Payload
    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: `${baseUrl}/api/mpesa/callback`,
      AccountReference: orderId,
      TransactionDesc: 'Payment for Order',
    }

    console.log('📤 STK Push Payload:', JSON.stringify(payload, null, 2))

    // 7️⃣ Determine endpoint
    const endpoint = process.env.MPESA_ENV === 'production'
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'

    console.log('🌐 Sending STK Push to:', endpoint)

    // 8️⃣ Send request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    console.log('📥 STK Push Response:', result)

    // 9️⃣ Check response
    if (result.ResponseCode !== '0') {
      throw new Error(`MPESA Error: ${result.ResponseDescription} | ResponseCode: ${result.ResponseCode}`)
    }

    console.log('✅ STK Push initiated successfully')
    return result
  } catch (error) {
    console.error('❌ STK Push Error:', error)
    throw new Error(`Failed to initiate STK Push: ${error instanceof Error ? error.message : error}`)
  }
}