'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function useMpesaSocketStatus(checkoutRequestId?: string) {
  const [status, setStatus] =
    useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING')

  useEffect(() => {
    if (!checkoutRequestId) return

    if (!socket) {
      socket = io({
        path: '/api/socket',
        transports: ['websocket'],
      })
    }

    const event = `mpesa:${checkoutRequestId}`

    socket.on(event, (data: { status: string }) => {
      if (data.status === 'SUCCESS' || data.status === 'FAILED') {
        setStatus(data.status)
      }
    })

    return () => {
      socket?.off(event)
    }
  }, [checkoutRequestId])

  return status
}