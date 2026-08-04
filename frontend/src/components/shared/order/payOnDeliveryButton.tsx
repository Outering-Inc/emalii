'use client'

import { Button } from '@/src/components/ui/button'
import { useRouter } from 'next/navigation'

export function PayOnDeliveryButton({ orderId }: { orderId: string }) {
  const router = useRouter()

  async function selectCOD() {
    await fetch(`/api/orders/${orderId}/select-cod`, {
      method: 'POST',
    })

    router.push(`/account/orders/${orderId}`)
  }

  return (
    <Button variant="outline" onClick={selectCOD} className="w-full">
      Pay on delivery
    </Button>
  )
}
