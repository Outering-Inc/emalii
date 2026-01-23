'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect } from 'react'
import { Card, CardContent, CardFooter, CardHeader } from '@/src/components/ui/card'
import { LeanProduct } from '@/src/types/product'
import Rating from './rating'
import ProductPrice from './product-price'
import ProductImageHover from './product-image-hover'
import AddToCart from './add-to-cart'
import { formatNumber, generateId, round2 } from '@/src/lib/utils/utils'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProductCardProps {
  product: LeanProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
}

export default function ProductCard({
  product,
  hideDetails = false,
  hideBorder = false,
  hideAddToCart = false,
}: ProductCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ------------------- SELECTED VARIANTS -------------------
  const urlColor = searchParams.get('color')
  const urlSize = searchParams.get('size')

  const selectedColor = product.colors.includes(urlColor ?? '') ? urlColor! : product.colors[0] ?? ''
  const selectedSize = product.sizes.includes(urlSize ?? '') ? urlSize! : product.sizes[0] ?? ''

  // ------------------- SYNC STATE WITH URL -------------------
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (selectedColor) params.set('color', selectedColor)
    if (selectedSize) params.set('size', selectedSize)
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [selectedColor, selectedSize, router, searchParams])

  // ------------------- FIND SELECTED VARIANT -------------------
  const selectedVariant =
    product.variants?.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    ) ?? null

  // Amazon-style variant fallback
   const variantId =
  selectedVariant?._id ?? product._id

  // ------------------- PRODUCT IMAGE -------------------
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`}>
      <div className="relative h-42 w-full">
        {product.images.length > 1 ? (
          <ProductImageHover
            src={product.images[0]}
            hoverSrc={product.images[1]}
            alt={product.name}
          />
        ) : (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="20vw"
            className="object-contain"
          />
        )}
      </div>
    </Link>
  )

  // ------------------- PRODUCT DETAILS -------------------
  const ProductDetails = () => (
    <div className="flex-1 space-y-1">
      <p className="font-bold">{product.brand}</p>
      <Link
        href={`/product/${product.slug}`}
        className="overflow-hidden text-ellipsis text-muted-foreground"
        style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
      >
        {product.name}
      </Link>
      <div className="flex gap-2 justify-center">
        <Rating rating={product.avgRating} />
        <span>({formatNumber(product.numReviews)})</span>
      </div>
      <ProductPrice
        isDeal={product.tags.includes('todays-deal')}
        price={product.price}
        listPrice={product.listPrice}
        forListing
      />
    </div>
  )

  // ------------------- ADD TO CART -------------------
  const AddButton = () => (
    <div className="w-full text-center pt-1">
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          variantId,
          size: selectedSize,
          color: selectedColor,
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: 1,
          image: product.images[0],
        }}
      />
    </div>
  )

  // ------------------- RENDER -------------------
  return hideBorder ? (
    <div className="flex flex-col">
      <ProductImage />
      {!hideDetails && (
        <>
          <div className="p-1 flex-1 text-center">
            <ProductDetails />
          </div>
          {!hideAddToCart && <AddButton />}
        </>
      )}
    </div>
  ) : (
    <Card className="flex flex-col">
      <CardHeader className="p-1">
        <ProductImage />
      </CardHeader>
      {!hideDetails && (
        <>
          <CardContent className="p-1 flex-1 text-center">
            <ProductDetails />
          </CardContent>
          <CardFooter className="p-1">
            {!hideAddToCart && <AddButton />}
          </CardFooter>
        </>
      )}
    </Card>
  )
}
