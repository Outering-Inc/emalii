'use client'

import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

type MpesaStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

type MpesaSocketPayload = {
  status: MpesaStatus
}

export function useMpesaSocket(checkoutRequestId?: string) {
  const [status, setStatus] = useState<MpesaStatus>('PENDING')

  useEffect(() => {
    if (!checkoutRequestId) return

    // Ensure socket server is booted
    fetch('/api/socket')

    const socket = io({
      path: '/api/socket',
    })

    socket.on(
      `mpesa:${checkoutRequestId}`,
      (data: MpesaSocketPayload) => {
        setStatus(data.status)
      }
    )

    return () => {
      socket.disconnect()
    }
  }, [checkoutRequestId])

  return status
}