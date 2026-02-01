/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect } from 'react'

export function useRestoreMpesaIntent(
  setTransaction: (tx: any) => void,
  setHasRestored: (v: boolean) => void
) {
  useEffect(() => {
    const saved = localStorage.getItem('mpesa:pending')
    if (!saved) return

    try {
      const tx = JSON.parse(saved)
      setTransaction(tx)
      setHasRestored(true) // 👈 mark as restored ONLY
    } catch {
      localStorage.removeItem('mpesa:pending')
    }
  }, [setTransaction, setHasRestored])
}