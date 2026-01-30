'use client'

import { Button } from '@/src/components/ui/button'
import ProductPrice from '@/src/components/shared/product/product-price'

interface MpesaPayButtonProps {
  loading: boolean
  priceInCents: number
}

export function MpesaPayButton({
  loading,
  priceInCents,
}: MpesaPayButtonProps) {
  return (
    <Button
      className="w-full"
      size="lg"
      disabled={loading}
      type="submit"
    >
      {loading ? (
        'Sending STK…'
      ) : (
        <>
          Pay – <ProductPrice price={priceInCents / 100} plain />
        </>
      )}
    </Button>
  )
}
