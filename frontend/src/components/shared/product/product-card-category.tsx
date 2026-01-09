/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/src/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'

import { LeanProduct } from '@/src/types/product'
import ProductPrice from './product-price'
import ProductImageHover from './product-image-hover'
import AddToCart from './add-to-cart'
import { generateId, round2 } from '@/src/lib/utils/utils'
import SelectVariantCategory from './select-variant-category'
import RatingSummaryCategory from './rating-summary-category'

interface ProductCardProps {
  product: LeanProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
}

export default function ProductCardCategory({
  product,
  hideDetails = false,
  hideBorder = false,
  hideAddToCart = false,
}: ProductCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // 🔥 Read from URL first (Amazon behavior)
  const urlColor = searchParams.get('color')
  const urlSize = searchParams.get('size')

  const [selectedColor, setSelectedColor] = useState(
    product.colors.includes(urlColor ?? '')
      ? urlColor!
      : product.colors?.[0]
  )

  const [selectedSize, setSelectedSize] = useState(
    product.sizes.includes(urlSize ?? '')
      ? urlSize!
      : product.sizes?.[0]
  )

  // 🔥 Sync state → URL (NO reload)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('color', selectedColor)
    params.set('size', selectedSize)

    router.replace(`?${params.toString()}`, {
      scroll: false,
    })
  }, [selectedColor, selectedSize])

  /**
   * ✅ Amazon/Noon-style image resolution
   */
  const variantImages =
    product.variantImages?.[selectedColor]

  const images =
    variantImages && variantImages.length > 0
      ? variantImages
      : product.images

  const ProductImage = () => (
    <Link
      href={`/product/${product.slug}?color=${selectedColor}&size=${selectedSize}`}
    >
      <div className="relative h-42 w-full">
        {images.length > 1 ? (
          <ProductImageHover
            src={images[0]}
            hoverSrc={images[1]}
            alt={product.name}
          />
        ) : (
          <Image
            src={images[0]}
            alt={product.name}
            fill
            sizes="20vw"
            className="object-contain"
          />
        )}
      </div>
    </Link>
  )

  const ProductDetails = () => (
    <div className="flex-1 space-y-2 text-center">
      <p className="font-bold">{product.brand}</p>

      <Link
        href={`/product/${product.slug}`}
        className="block text-sm text-muted-foreground line-clamp-2"
      >
        {product.name}
      </Link>

      <div className="flex justify-center gap-2">
        <RatingSummaryCategory
          avgRating={product.avgRating}
          numReviews={product.numReviews}
          asPopover
          ratingDistribution={
            product.ratingDistribution ?? []
          }
          productSlug={product.slug} // <-- pass the slug here
        />
      </div>

      <ProductPrice
        isDeal={product.tags?.includes('todays-deal')}
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />

      <SelectVariantCategory
        product={product}
        size={selectedSize}
        color={selectedColor}
        onChange={({ size, color }) => {
          setSelectedSize(size)
          setSelectedColor(color)
        }}
      />
    </div>
  )

  const AddButton = () => (
    <div className="pt-2">
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          size: selectedSize,
          color: selectedColor,
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: 1,
          image: images[0],
        }}
      />
    </div>
  )

  if (hideBorder) {
    return (
      <div className="flex flex-col">
        <ProductImage />
        {!hideDetails && (
          <>
            <div className="p-1 flex-1">
              <ProductDetails />
            </div>
            {!hideAddToCart && <AddButton />}
          </>
        )}
      </div>
    )
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-1">
        <ProductImage />
      </CardHeader>

      {!hideDetails && (
        <>
          <CardContent className="p-2 flex-1">
            <ProductDetails />
          </CardContent>

          {!hideAddToCart && (
            <CardFooter className="p-2">
              <AddButton />
            </CardFooter>
          )}
        </>
      )}
    </Card>
  )
}
