import crypto from 'crypto'

export function verifyMpesaSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  return computed === signature
}
