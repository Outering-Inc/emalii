// src/lib/security/isSafaricomIp.ts
import { SAFARICOM_IP_RANGES } from '@/src/lib/payments/mpesa/safaricom-ips'

export function isSafaricomIp(ip: string | null) {
  if (!ip) return false

  // strip IPv6 wrapper (::ffff:)
  const cleanIp = ip.replace('::ffff:', '')

  return SAFARICOM_IP_RANGES.some(range =>
    cleanIp.startsWith(range),
  )
}