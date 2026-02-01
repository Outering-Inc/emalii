/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'

export function useRestoreMpesaIntent(
  restore: (tx: any) => void
) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx = JSON.parse(saved)
      restore(tx)
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [restore])
}