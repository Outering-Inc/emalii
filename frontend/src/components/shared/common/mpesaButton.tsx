'use client'
import { Button } from '@/src/components/ui/button'
import ProductPrice from '@/src/components/shared/product/product-price'

interface MpesaPayButtonProps {
  loading: boolean
  priceInCents: number
}

export function MpesaPayButton({ loading, priceInCents }: MpesaPayButtonProps) {
  return (
    <Button className="w-full mt-4  bg-green-600" size="lg" disabled={loading} type="submit">
      {loading ? 'Processing transaction…' : <>Pay – <ProductPrice price={priceInCents / 100} plain /></>}
    </Button>
  )
}