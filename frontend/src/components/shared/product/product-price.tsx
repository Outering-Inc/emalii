'use client'

import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { cn, round2 } from '@/src/lib/utils/utils'
import { useFormatter, useTranslations } from 'next-intl'

interface ProductPriceProps {
  price: number
  listPrice?: number
  discountPrice?: number
  isDeal?: boolean
  forListing?: boolean
  plain?: boolean
  className?: string
}

const ProductPrice = ({
  price,
  listPrice = 0,
  discountPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
  className,
}: ProductPriceProps) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()
  const format = useFormatter()

  // Convert to selected currency
  const convertedPrice = round2(currency.convertRate * price)
  const convertedListPrice = round2(currency.convertRate * listPrice)
  const convertedDiscountPrice = round2(currency.convertRate * discountPrice)

  // Discount % calculation
  const discountPercent =
    convertedListPrice > 0
      ? Math.round((convertedDiscountPrice / convertedListPrice) * 100)
      : 0

  // Split int and decimals for custom styling
  const stringValue = convertedPrice.toFixed(2)
  const [intValue, floatValue] = stringValue.split('.')

  if (plain) {
    return format.number(convertedPrice, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
    })
  }

  // If no listPrice provided, show normal price
  if (!listPrice || listPrice === 0) {
    return (
      <div className={cn('text-3xl', className)}>
        <span className='text-xs align-super'>{currency.symbol}</span>
        {intValue}
        <span className='text-xs align-super'>{floatValue}</span>
      </div>
    )
  }

  // Flash Deal / Special deal style
  if (isDeal) {
    return (
      <div className='space-y-2'>
        <div className='flex justify-center items-center gap-2'>
          <span className='bg-red-700 rounded-sm p-1 text-white text-sm font-semibold'>
            {discountPercent}% {t('Product.Off')}
          </span>
          <span className='text-red-700 text-xs font-bold'>
            {t('Product.Limited time deal')}
          </span>
        </div>
        <div className={`flex ${forListing && 'justify-center'} items-center gap-2`}>
          <div className={cn('text-3xl', className)}>
            <span className='text-xs align-super'>{currency.symbol}</span>
            {intValue}
            <span className='text-xs align-super'>{floatValue}</span>
          </div>
          <div className='text-muted-foreground text-xs py-2'>
            {t('Product.Was')}:{' '}
            <span className='line-through'>
              {format.number(convertedListPrice, {
                style: 'currency',
                currency: currency.code,
                currencyDisplay: 'narrowSymbol',
              })}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Regular discounted price
  return (
    <div>
      <div className='flex justify-center gap-3'>
        {discountPercent > 0 && (
          <div className='text-3xl text-orange-700'>-{discountPercent}%</div>
        )}
        <div className={cn('text-3xl', className)}>
          <span className='text-xs align-super'>{currency.symbol}</span>
          {intValue}
          <span className='text-xs align-super'>{floatValue}</span>
        </div>
      </div>
      {discountPercent > 0 && (
        <div className='text-muted-foreground text-xs py-2'>
          {t('Product.List price')}:{' '}
          <span className='line-through'>
            {format.number(convertedListPrice, {
              style: 'currency',
              currency: currency.code,
              currencyDisplay: 'narrowSymbol',
            })}
          </span>
        </div>
      )}
    </div>
  )
}

export default ProductPrice
