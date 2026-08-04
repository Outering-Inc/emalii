import { extractAmount, extractPhone, extractTransactionDate } from '@/src/lib/utils/mpesa'
import type { RawMpesaCallback } from '@/src/types/mpesa'

export interface ParsedMpesaCallback {
  resultCode: number
  resultDesc: string
  checkoutRequestID: string
  merchantRequestId: string
  amount: number
  phone?: string
  transactionDate: string
  orderId?: string
  mpesaReceiptNumber?: string
  user?: string
  customerId?: string
}

export function validateCallback(data: RawMpesaCallback): ParsedMpesaCallback {
  if (!data?.Body?.stkCallback) {
    throw new Error('Invalid M-Pesa callback: Missing stkCallback')
  }

  const callback = data.Body.stkCallback
  const metadata = callback.CallbackMetadata?.Item || []

  const getMetadataValue = (name: string): string | undefined => {
    const found = metadata.find((item) => item.Name === name)
    return found?.Value != null ? String(found.Value) : undefined
  }

  const parsed: ParsedMpesaCallback = {
    resultCode: callback.ResultCode ?? -1,
    resultDesc: callback.ResultDesc ?? 'Missing ResultDesc',
    checkoutRequestID: callback.CheckoutRequestID ?? '',
    merchantRequestId: callback.MerchantRequestID ?? '',
    amount: extractAmount(data),
    phone: extractPhone(data) || undefined,
    transactionDate: extractTransactionDate(data),
    mpesaReceiptNumber: getMetadataValue('MpesaReceiptNumber'),
    orderId: getMetadataValue('AccountReference'),
    user: '',
  }

  // 🔒 Always required (even on failure)
  if (!parsed.checkoutRequestID || !parsed.merchantRequestId) {
    throw new Error('Missing critical Mpesa identifiers')
  }

  // ✅ Only require receipt + phone on SUCCESS
  if (parsed.resultCode === 0) {
    if (!parsed.mpesaReceiptNumber) {
      throw new Error('Successful payment missing receipt number')
    }
    if (!parsed.phone) {
      throw new Error('Successful payment missing phone number')
    }
  }

  return parsed
}
