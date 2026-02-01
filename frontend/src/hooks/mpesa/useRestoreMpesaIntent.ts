/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect } from 'react'

export function useRestoreMpesaIntent(setTransaction: any) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx = JSON.parse(saved)
      setTransaction(tx)
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction])
}