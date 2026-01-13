'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle2Icon } from 'lucide-react'
import { Card, CardContent } from '@/src/components/ui/card'
import ProductPrice from '@/src/components/shared/product/product-price'
import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import { useTranslations } from 'next-intl'
import useCartStore from '@/src/hooks/stores/use-cart-store'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { notFound } from 'next/navigation'

export default function CartAddItem({ itemId }: { itemId: string }) {
  const {
    cart: { items, itemsPrice },
  } = useCartStore()

  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const item = items.find((x) => x.clientId === itemId)
  const t = useTranslations()

  if (!item) return notFound()

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <Card className='rounded-none'>
          <CardContent className='flex gap-4 items-center py-4'>
            <Image src={item.image} alt={item.name} width={80} height={80} />
            <div>
              <h3 className='flex gap-2 text-xl font-bold'>
                <CheckCircle2Icon className='text-green-700' />
                {t('Cart.Added to cart')}
              </h3>
              <p>{t('Cart.Color')}: {item.color}</p>
              <p>{t('Cart.Size')}: {item.size}</p>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-none'>
          <CardContent className='p-4 space-y-4'>
            {itemsPrice < freeShippingMinPrice ? (
              <div>
                {t('Cart.Add')}{' '}
                <ProductPrice
                  price={freeShippingMinPrice - itemsPrice}
                  plain
                />{' '}
                {t('Cart.of eligible items to your order to qualify for FREE Shipping')}
              </div>
            ) : (
              <div className='text-green-700'>
                {t('Cart.Your order qualifies for FREE Shipping')}
              </div>
            )}

            <Link href='/checkout' className='block text-center font-semibold'>
              Proceed to Checkout
            </Link>
          </CardContent>
        </Card>
      </div>

      <BrowsingHistoryList />
    </div>
  )
}
