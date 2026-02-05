'use client'

import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

// ⏱ TTL in milliseconds (e.g. 10 minutes)
const SOCKET_TTL_MS = 10 * 60 * 1000

export function useMpesaSocketStatus(checkoutRequestId?: string) {
  const [status, setStatus] =
    useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING')

  // ⏱ keep TTL timer reference
  const ttlTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!checkoutRequestId) return

    if (!socket) {
      socket = io({
        path: '/api/socket',
        transports: ['websocket'],
      })
    }

    const event = `mpesa:${checkoutRequestId}`

    // ⏱ START TTL countdown
    ttlTimerRef.current = setTimeout(() => {
      setStatus('FAILED') // treat TTL as failed
      socket?.off(event)
    }, SOCKET_TTL_MS)

    socket.on(event, (data: { status: string }) => {
      if (data.status === 'SUCCESS' || data.status === 'FAILED') {
        setStatus(data.status)

        // ⏱ clear TTL once resolved
        if (ttlTimerRef.current) {
          clearTimeout(ttlTimerRef.current)
          ttlTimerRef.current = null
        }
      }
    })

    return () => {
      socket?.off(event)

      if (ttlTimerRef.current) {
        clearTimeout(ttlTimerRef.current)
        ttlTimerRef.current = null
      }
    }
  }, [checkoutRequestId])

  return status
}
