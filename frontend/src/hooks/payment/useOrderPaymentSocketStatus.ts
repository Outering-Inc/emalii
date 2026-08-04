'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { OrderStatus, TERMINAL_STATUSES } from '@/src/lib/orders/order-status'

type SocketPayload = {
  orderId: string
  status: OrderStatus
  isPaid: boolean
}

let socket: Socket | null = null

export function useOrderPaymentSocketStatus(orderId: string) {
  const [status, setStatus] = useState<OrderStatus>('PENDING')
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    if (!orderId) return

    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
        transports: ['websocket'],
      })
    }

    socket.emit('join', `order:${orderId}`)

    socket.on('order:status', (data: SocketPayload) => {
      if (data.orderId !== orderId) return
      setStatus(data.status)
      setIsPaid(data.isPaid)
    })

    return () => {
      socket?.emit('leave', `order:${orderId}`)
    }
  }, [orderId])

  return {
    status,
    isPaid,
    isTerminal: TERMINAL_STATUSES.includes(status),
  }
}
