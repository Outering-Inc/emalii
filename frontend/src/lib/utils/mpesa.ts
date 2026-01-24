// utils/mpesa.ts

import { RawMpesaCallback, CallbackMetadataItem } from '@/src/types/mpesa'

// Helper to get metadata value by name
function findMetadataValue(
  data: RawMpesaCallback,
  name: string
): string | number | undefined {
  return data.Body?.stkCallback?.CallbackMetadata?.Item?.find(
    (item: CallbackMetadataItem) => item.Name === name
  )?.Value
}

// Extracts the transaction amount from the callback
export function extractAmount(data: RawMpesaCallback): number {
  const value = findMetadataValue(data, 'Amount')
  return typeof value === 'number' ? value : 0
}

// Extracts the phone number from the callback
export function extractPhone(data: RawMpesaCallback): string {
  const value = findMetadataValue(data, 'PhoneNumber')
  return value?.toString() ?? ''
}

// Extracts the transaction date (as string) from the callback
export function extractTransactionDate(data: RawMpesaCallback): string {
  const value = findMetadataValue(data, 'TransactionDate')
  return value?.toString() ?? new Date().toISOString()
}

// Extracts the receipt number from the callback
export function extractMpesaReceiptNumber(data: RawMpesaCallback): string {
  const value = findMetadataValue(data, 'MpesaReceiptNumber')
  return value?.toString() ?? ''
}

// Extracts the payer name if available
export function extractPayerName(data: RawMpesaCallback): string {
  const value = findMetadataValue(data, 'Name')
  return value?.toString() ?? ''
}

// Sanitize Kenyan phone numbers to the format 2547XXXXXXXX
export function sanitizeKenyanPhone(phone: string): string | null {
  if (!phone) return null

  // Remove spaces, dashes, etc
  let cleaned = phone.replace(/\D/g, '')

  if (cleaned.startsWith('07') && cleaned.length === 10) {
    cleaned = '254' + cleaned.slice(1)
  } else if (cleaned.startsWith('7') && cleaned.length === 9) {
    cleaned = '254' + cleaned
  } else if (cleaned.startsWith('254') && cleaned.length === 12) {
    // valid
  } else {
    return null
  }

  return cleaned
}
