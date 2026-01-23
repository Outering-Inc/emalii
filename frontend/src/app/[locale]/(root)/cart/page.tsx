'use client'
import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import ProductPrice from '@/src/components/shared/product/product-price'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select'
import useCartStore from '@/src/hooks/stores/use-cart-store'
import { useTranslations } from 'next-intl'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import CartPriceSummary from './[itemId]/cart-pricing-summary'
import { useCartPrice } from '@/src/hooks/stores/use-cart-price'

export default function CartPage() {
  const { updateItem, removeItem } = useCartStore()

    const {
    items,
    itemsPrice,
    listItemsPrice,
    discount,
    totalItems,
    remainingForFreeShipping,
    qualifiesForFreeShipping,
  } = useCartPrice()

  const t = useTranslations()

  return (
    <div>
      <div className='grid grid-cols-1 md:grid-cols-4  md:gap-4'>
        {items.length === 0 ? (
          <Card className='col-span-4 rounded-none'>
            <CardHeader className='text-3xl  '>
              {t('Cart.Your Shopping Cart is empty')}
            </CardHeader>
            <CardContent>
              {t.rich('Cart.Continue shopping on', {              
                home: (chunks) => <Link href='/'>{chunks}</Link>,
              })}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className='col-span-3'>
              <Card className='rounded-none'>
                <CardHeader className='text-3xl pb-0'>
                  {t('Cart.Shopping Cart')}
                </CardHeader>
                <CardContent className='p-4'>
                  <div className='flex justify-end border-b mb-4'>
                    {t('Cart.Price')}
                  </div>

                  {items.map((item) => (
                    <div
                      key={item.clientId}
                      className='flex flex-col md:flex-row justify-between py-4 border-b gap-4'
                    >
                      <Link href={`/product/${item.slug}`}>
                        <div className='relative w-40 h-40'>
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes='20vw'
                            style={{
                              objectFit: 'contain',
                            }}
                          />
                        </div>
                      </Link>

                      <div className='flex-1 space-y-4'>
                        <Link
                          href={`/product/${item.slug}`}
                          className='text-lg hover:no-underline  '
                        >
                          {item.name}
                        </Link>
                        <div>
                          <p className="text-sm flex items-center gap-2">
                            <span className="font-bold">{t('Cart.Color')}:</span>

                            {/* Color dot */}
                          <span
                            className="inline-block w-5 h-5 rounded-full border"
                            style={{ backgroundColor: item.color }}
                            aria-label={item.color}
                          />

                            {/* Color text */}
                          <span className="capitalize text-gray-700">
                            {item.color}
                          </span>
                          </p>

                          <p className='text-sm'>
                            <span className='font-bold'>
                              {' '}
                              {t('Cart.Size')}:{' '}
                            </span>{' '}
                            {item.size}
                          </p>
                        </div>
                        <div className='flex gap-2 items-center'>
                          <Select
                            value={item.quantity.toString()}
                            onValueChange={(value) =>
                              updateItem(item, Number(value))
                            }
                          >
                            <SelectTrigger className='w-auto'>
                              <SelectValue>
                                {t('Cart.Quantity')}: {item.quantity}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent position='popper'>
                              {Array.from({
                                length: item.countInStock,
                              }).map((_, i) => (
                                <SelectItem key={i + 1} value={`${i + 1}`}>
                                  {i + 1}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            variant={'outline'}
                            onClick={() => removeItem(item)}
                          >
                            {t('Cart.Delete')}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className='text-right'>
                          {item.quantity > 1 && (
                            <>
                              {item.quantity} x
                              <ProductPrice price={item.price} plain />
                              <br />
                            </>
                          )}

                          <span className='font-bold text-lg'>
                            <ProductPrice
                              price={item.price * item.quantity}
                              plain
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className='flex justify-end text-lg my-2'>
                    {t('Cart.Subtotal')} ({totalItems} {t('Cart.Items')}):{' '}
                    <span className='font-bold ml-1'>
                      <ProductPrice price={itemsPrice} plain />
                    </span>{' '}
                  </div>
                </CardContent>
              </Card>
            </div>
         {/* RIGHT SIDE - Cart Summary */}
            <div>
              <Card className='rounded-none '>
                <CardContent className='py-4'>
                  <CartPriceSummary
                    itemsPrice={itemsPrice}
                    totalItems={totalItems}
                    qualifiesForFreeShipping={qualifiesForFreeShipping}
                    remainingForFreeShipping={remainingForFreeShipping}
                    listItemsPrice={listItemsPrice}
                    discount={discount}
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
      <BrowsingHistoryList className='mt-10' />
    </div>
  )
}
