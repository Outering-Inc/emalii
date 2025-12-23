'use client'

import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { round2, cn } from '@/src/lib/utils/utils'
import { useTranslations } from 'next-intl'

interface DiscountBadgeProps {
  price: number
  listPrice?: number
    className?: string
}

const DiscountBadge = ({
  price,
  listPrice = 0,
  className,
}: DiscountBadgeProps) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const t = useTranslations()

  // ❗ No list price → no discount
  if (!listPrice || listPrice <= price) return null

  const convertedPrice = round2(currency.convertRate * price)
  const convertedListPrice = round2(currency.convertRate * listPrice)

  const discountPercent = Math.round(
    100 - (convertedPrice / convertedListPrice) * 100
  )

  if (discountPercent <= 0) return null

  return (
    <span
      className={cn(
        'absolute top-2 right-2 bg-red-700 rounded-sm px-1.5 py-0.5 text-white text-xs font-semibold',
        className
      )}
    >
      {discountPercent}% {t('Product.Off')}
    </span>
  )
}

export default DiscountBadge
