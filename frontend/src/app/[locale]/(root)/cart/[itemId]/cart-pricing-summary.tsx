'use client'

import ProductPrice from '@/src/components/shared/product/product-price'
import { Button } from '@/src/components/ui/button'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

interface CartPriceSummaryProps {
  itemsPrice: number
  totalItems: number
  qualifiesForFreeShipping: boolean
  remainingForFreeShipping: number
  listItemsPrice?: number
  discount?: number
}

export default function CartPriceSummary({
  itemsPrice,
  totalItems,
  qualifiesForFreeShipping,
  remainingForFreeShipping= 25,
  listItemsPrice = 0,
  discount = 0,
}: CartPriceSummaryProps) {
  const router = useRouter()
  const t = useTranslations()

  return (
    <div className='space-y-4'>
      {/* Free Shipping */}
      {!qualifiesForFreeShipping ? (
        <div>
          {t('Cart.Add')}{' '}
          <span className='text-green-700'>
            <ProductPrice price={remainingForFreeShipping} plain />
          </span>{' '}
          {t(
            'Cart.of eligible items to your order to qualify for FREE Shipping'
          )}
        </div>
      ) : (
        <div className='text-green-700'>
          {t('Cart.Your order qualifies for FREE Shipping')}
        </div>
      )}

      {/* List Price (Was Price) */}
      {discount > 0 && (
        <div className='text-sm text-muted-foreground'>
          {t('Cart.Was')}:{' '}
          <span className='line-through'>
            <ProductPrice price={listItemsPrice} plain />
          </span>
        </div>
      )}

      {/* Discount */}
      {discount > 0 && (
        <div className='text-red-700 font-medium'>
          {t('Cart.Discount')} <ProductPrice price={discount} plain />
        </div>
      )}

      {/* Subtotal (Final Payable) */}
      <div className='text-lg'>
        {t('Cart.Subtotal')} ({totalItems} {t('Cart.ItemsPrice')}):{' '}
        <span className='font-bold'>
          <ProductPrice price={itemsPrice} plain />
        </span>
      </div>

      {/* Checkout */}
      <Button
        onClick={() => router.push('/checkout')}
        className='rounded-full w-full'
      >
        {t('Cart.Proceed to Checkout')}
      </Button>
    </div>
  )
}
