/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AddToCart from '@/src/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/src/components/ui/card'
import ProductPrice from '@/src/components/shared/product/product-price'
import { Separator } from '@/src/components/ui/separator'
import ProductSlider from '@/src/components/shared/product/product-slider'
import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import AddToBrowsingHistory from '@/src/components/shared/product/add-to-browsing-history'
import { generateId, round2 } from '@/src/lib/utils/utils'
import RatingSummary from '@/src/components/shared/product/rating-summary'
import ReviewList from './review-list'
import SelectVariantCategory from '@/src/components/shared/product/select-variant-category'
import ProductGalleryContainer from '@/src/components/shared/product/product-gallery-container'
import { resolveVariantImages } from '@/src/hooks/stores/resolveVariantImages'
import { features } from 'process'
import { useTranslations } from 'next-intl'


interface Props {
  product: any
  relatedProducts: any
  userId?: string
  searchParams: { page?: string; color?: string; size?: string }
}

export default function ProductDetailsClient({
  product,
  relatedProducts,
  userId,
}: Props) {
  const t = useTranslations('Product')
  const router = useRouter()
  const params = useSearchParams()

  /* ---------------- URL → STATE ---------------- */
  const urlColor = params.get('color')
  const urlSize = params.get('size')

  const [selectedColor, setSelectedColor] = useState(
    product.colors?.includes(urlColor ?? '')
      ? urlColor!
      : product.colors?.[0] ?? ''
  )

  const [selectedSize, setSelectedSize] = useState(
    product.sizes?.includes(urlSize ?? '')
      ? urlSize!
      : product.sizes?.[0] ?? ''
  )

  /* ---------------- STATE → URL ---------------- */
      useEffect(() => {
      const qp = new URLSearchParams(params.toString())

      if (selectedColor) qp.set('color', selectedColor)
      if (selectedSize) qp.set('size', selectedSize)

      router.replace(`?${qp.toString()}`, { scroll: false })
    }, [selectedColor, selectedSize, params, router])


  /* ---------------- VARIANT RESOLUTION ---------------- */
  const selectedVariant =
    product.variants?.find(
      (v: any) => v.color === selectedColor && v.size === selectedSize
    ) ?? null

  const requiresVariant =
    (product.colors?.length ?? 0) > 1 ||
    (product.sizes?.length ?? 0) > 1

  const isOutOfStock = selectedVariant
    ? selectedVariant.stock === 0
    : false

  const images = resolveVariantImages(product, selectedColor, selectedSize)
  const mainImage = images[0]

  /* ---------------- PRELOAD VARIANT IMAGES ---------------- */
  useEffect(() => {
    product.colors?.forEach((color: string) => {
      product.variantImages?.[color]?.forEach((img: string) => {
        const image = new Image()
        image.src = img
      })
    })
  }, [product])

  /* ---------------- STRUCTURED DATA ---------------- */
  const structureData = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name: product.name,
    image: mainImage,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating,
      ratingCount: product.numReviews,
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        product.countInStock > 0
          ? 'http://schema.org/InStock'
          : 'http://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Emalii.com' },
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Color', value: selectedColor },
      { '@type': 'PropertyValue', name: 'Size', value: selectedSize },
      { '@type': 'PropertyValue', name: 'Features', value: features },
    ],
  }

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structureData) }}
      />

      <AddToBrowsingHistory id={product._id} category={product.category} />

      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Gallery */}
          <div className="col-span-2">
            <ProductGalleryContainer product={product} />
          </div>

          {/* Details */}
          <div className="col-span-2 flex flex-col gap-4 md:p-5">
            <p className="p-medium-16 rounded-full bg-grey-500/10 text-grey-500">
              {t('Brand')} {product.brand} {product.category}
            </p>

            <h1 className="font-bold text-lg lg:text-xl">{product.name}</h1>

            <RatingSummary
              avgRating={product.avgRating}
              numReviews={product.numReviews}
              asPopover
              ratingDistribution={product.ratingDistribution}
            />

            <Separator />

            <ProductPrice
              price={product.price}
              listPrice={product.listPrice}
              isDeal={product.tags.includes('todays-deal')}
              forListing={false}
            />

            <SelectVariantCategory
              product={product}
              size={selectedSize}
              color={selectedColor}
              disableOutOfStock
              onChange={({ size, color }) => {
              setSelectedSize(size)
              setSelectedColor(color)
              }}
            />

            <Separator />

            <p className="p-bold-20 text-grey-600">
              {t('Description')}:
            </p>
            <p>{product.description}</p>
          </div>

          {/* Cart */}
          <div className="col-span-1">
            <Card>
              <CardContent className="flex flex-col gap-4">
                <ProductPrice price={product.price} />

                {product.countInStock > 0 && product.countInStock <= 3 && (
                  <div className="text-destructive font-bold">
                    {t('Only X left in stock - order soon', {
                      count: product.countInStock,
                    })}
                  </div>
                )}

                {product.countInStock !== 0 ? (
                  <div className="text-green-700 text-xl">
                    {t('In Stock')}
                  </div>
                ) : (
                  <div className="text-destructive text-xl">
                    {t('Out of Stock')}
                  </div>
                )}

                {/* Add to cart logic */}
                {requiresVariant && (!selectedColor || !selectedSize) && (
                  <button disabled className="btn-disabled">
                    Select color and size
                  </button>
                )}

                {requiresVariant && selectedVariant && isOutOfStock && (
                  <button disabled className="btn-disabled">
                    Currently unavailable
                  </button>
                )}

                {(!requiresVariant ||
                  (selectedColor &&
                    selectedSize &&
                    selectedVariant &&
                    !isOutOfStock)) && (
                  <AddToCart
                    minimal
                    item={{
                      clientId: generateId(),
                      product: product._id,
                      name: product.name,
                      slug: product.slug,
                      category: product.category,
                      image: mainImage,
                      price: round2(product.price),
                      quantity: 1,
                      countInStock: selectedVariant
                        ? selectedVariant.stock
                        : product.countInStock,
                      color: selectedColor,
                      size: selectedSize,
                    }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="h2-bold mb-2" id="reviews">
          {t('Customer Reviews')}
        </h2>
        <ReviewList product={product} userId={userId} />
      </section>

      <section className="mt-10">
        <ProductSlider
          products={relatedProducts.data}
          title={t('Best Sellers in', { name: product.category })}
        />
      </section>

      <BrowsingHistoryList className="mt-10" />
    </div>
  )
}
