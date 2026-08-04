import { getSocketServer } from '../server'

export function emitPaymentEvent(
  orderId: string,
  payload: {
    status: 'PENDING' | 'SUCCESS' | 'FAILED'
    provider?: string
    reason?: string
    paidAmount?: number     // ✅ add this
    expectedAmount?: number // optional, if you want
  }
) {
  const io = getSocketServer()
  if (!io) return

  io.to(`order:${orderId}`).emit('payment:update', payload)
}
