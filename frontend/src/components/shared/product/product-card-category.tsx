/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/src/components/ui/card'

import { LeanProduct } from '@/src/types/product'
import ProductPrice from './product-price'
import ProductImageHover from './product-image-hover'
import AddToCart from './add-to-cart'
import SelectVariantCategory from './select-variant-category'
import RatingSummaryCategory from './rating-summary-category'

import { generateId, round2 } from '@/src/lib/utils/utils'

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

  /* ---------------- URL → STATE (Amazon behavior) ---------------- */

  const urlColor = searchParams.get('color')
  const urlSize = searchParams.get('size')

  /* ---------------- STATE ---------------- */

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

  /* ---------------- STATE → URL (NO reload) ---------------- */

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedColor) params.set('color', selectedColor)
    if (selectedSize) params.set('size', selectedSize)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [selectedColor, selectedSize])

  /* ---------------- VARIANT RESOLUTION ---------------- */

  const selectedVariant =
    product.variants?.find(
      v => v.color === selectedColor && v.size === selectedSize
    ) ?? null


  const requiresVariant =
    (product.colors?.length ?? 0) > 1 ||
    (product.sizes?.length ?? 0) > 1

  const isOutOfStock = selectedVariant
    ? selectedVariant.stock === 0
    : false

  /* ---------------- IMAGE ---------------- */
  const images =
    selectedVariant?.images?.length
      ? selectedVariant.images
      : product.images ?? []

  const mainImage = images[0] || '/images/placeholder.png'
  const hoverImage = images[1]

  const ProductImage = () => (
    <Link
      href={`/product/${product.slug}?color=${selectedColor}&size=${selectedSize}`}
      className="block"
    >
      <div className="relative w-full aspect-[3/4] bg-muted">
        {hoverImage ? (
          <ProductImageHover
            src={mainImage}
            hoverSrc={hoverImage}
            alt={product.name}
          />
        ) : (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
            className="object-contain"
          />
        )}
      </div>
    </Link>
  )

  /* ---------------- DETAILS ---------------- */

  const ProductDetails = () => (
    <div className="flex-1 space-y-2 text-center">
      <p className="font-bold">{product.brand}</p>

      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden text-ellipsis text-muted-foreground"
        style={{
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {product.name}
      </Link>

      <div className="flex justify-center">
        <RatingSummaryCategory
          avgRating={product.avgRating}
          numReviews={product.numReviews}
          asPopover
          ratingDistribution={product.ratingDistribution ?? []}
          productSlug={product.slug}
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

  /* ---------------- ADD TO CART (AMAZON STYLE) ---------------- */

  const AddButton = () => {
    if (requiresVariant && !selectedVariant) {
      return (
        <div className="pt-2 w-full">
          <button
            disabled
            className="w-full rounded-md border bg-muted py-2 text-sm text-muted-foreground cursor-not-allowed"
          >
            Select options
          </button>
        </div>
      )
    }

    if (isOutOfStock) {
      return (
        <div className="pt-2 w-full">
          <button
            disabled
            className="w-full rounded-md border bg-muted py-2 text-sm text-muted-foreground cursor-not-allowed"
          >
            Currently unavailable
          </button>
        </div>
      )
    }

    if (!selectedVariant) return null

    return (
      <div className="pt-2 w-full">
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
            countInStock: selectedVariant.stock,
            color: selectedColor,
            size: selectedSize,
          }}
        />
      </div>
    )
  }

  /* ---------------- RENDER ---------------- */

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
