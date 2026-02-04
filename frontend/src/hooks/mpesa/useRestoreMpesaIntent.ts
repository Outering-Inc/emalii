/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect } from 'react'

export function useRestoreMpesaIntent(
  setTransaction: (tx: any) => void
) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx = JSON.parse(saved)
      // Only restore the transaction object, DO NOT mark STK initiated
      setTransaction(tx)
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction])
}