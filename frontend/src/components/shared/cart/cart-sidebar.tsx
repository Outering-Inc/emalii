'use client'

import useCartStore from '@/src/hooks/stores/use-cart-store'
import { cn } from '@/src/lib/utils/utils'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Button, buttonVariants } from '@/src/components/ui/button'
import { Separator } from '@/src/components/ui/separator'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import Image from 'next/image'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import { TrashIcon } from 'lucide-react'
import ProductPrice from '@/src/components/shared/product/product-price'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { getDirection } from '@/src/lib/i18n/config/i18n-config'


export default function CartSidebar() {
  const {
    cart: { items, itemsPrice },
    updateItem,
    removeItem,
  } = useCartStore()
  const {
    setting: {
      common: { freeShippingMinPrice },
    },
  } = useSettingStore()

  const t = useTranslations()

  const locale = useLocale()
  return (
    <div className='w-32 overflow-y-auto'>
      <div
        className={`w-32 fixed  h-full ${
          getDirection(locale) === 'rtl' ? 'border-r' : 'border-l'
        }`}
      >
        <div className='p-2 h-full flex flex-col gap-2 justify-center items-center'>
          <div className='text-center space-y-2'>
            <div> {t('Cart.Subtotal')}</div>
            <div className='font-bold '>
              <ProductPrice price={itemsPrice} plain />
            </div>
            {itemsPrice > freeShippingMinPrice && (
              <div className=' text-center text-xs'>
                {t('Cart.Your order qualifies for FREE Shipping')}
              </div>
            )}

            <Link
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'rounded-full hover:no-underline w-full'
              )}
              href='/cart'
            >
              {t('Cart.Go to Cart')}
            </Link>
            <Separator className='mt-3' />
          </div>

          <ScrollArea className='flex-1  w-full'>
            {items.map((item) => (
              <div key={item.clientId}>
                <div className='my-3'>
                  <Link href={`/product/${item.slug}`}>
                    <div className='relative h-24'>
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes='20vw'
                        className='object-contain'
                      />
                    </div>
                  </Link>
                  <div className='text-sm text-center font-bold'>
                    <ProductPrice price={item.price} plain />
                  </div>
                  <div className='flex gap-2 mt-2'>
                    <Select
                      value={item.quantity.toString()}
                      onValueChange={(value) => {
                        updateItem(item, Number(value))
                      }}
                    >
                      <SelectTrigger className='text-xs w-12 ml-1 h-auto py-0'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: item.countInStock }).map(
                          (_, i) => (
                            <SelectItem value={(i + 1).toString()} key={i + 1}>
                              {i + 1}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant={'outline'}
                      size={'sm'}
                      onClick={() => {
                        removeItem(item)
                      }}
                    >
                      <TrashIcon className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
                <Separator />
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}