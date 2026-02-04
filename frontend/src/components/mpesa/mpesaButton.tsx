import { Button } from "../ui/button"
import ProductPrice from "../shared/product/product-price"

interface MpesaPayButtonProps {
  loading: boolean
  priceInCents: number
  disabled?: boolean // optional override
}

export function MpesaPayButton({
  loading,
  priceInCents,
  disabled,
}: MpesaPayButtonProps) {
  return (
    <Button
      className="w-full mt-4 bg-green-600"
      size="lg"
      disabled={loading || disabled} // combines internal & external
      type="submit"
    >
      {loading ? 'Processing transaction…' : <>Pay – <ProductPrice price={priceInCents / 100} plain /></>}
    </Button>
  )
}