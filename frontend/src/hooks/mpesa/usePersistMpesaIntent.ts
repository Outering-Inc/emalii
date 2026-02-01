/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'
import { useEffect } from 'react'

export function usePersistMpesaIntent(transaction: any) {
  useEffect(() => {
    if (transaction) {
      localStorage.setItem(
        'mpesa:pending',
        JSON.stringify(transaction)
      )
    } else {
      localStorage.removeItem('mpesa:pending')
    }
  }, [transaction])
}