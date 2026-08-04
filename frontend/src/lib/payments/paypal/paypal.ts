import { generatePayPalAccessToken, handleResponse } from "./auth"

const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'

export const paypal = {
  createOrder: async function createOrder(price: number) {
    const accessToken = await generatePayPalAccessToken()
    console.log('Access Token (Create Order):', accessToken)

    const url = `${base}/v2/checkout/orders`
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: price,
            },
          },
        ],
      }),
    })

    return handleResponse(response)
  },

    //Capture OrderId in paypal not product orderId
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generatePayPalAccessToken()
    console.log('Access Token (Capture Payment):', accessToken)

    const url = `${base}/v2/checkout/orders/${orderId}/capture`
    const response = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    return handleResponse(response)
  },
}

