// src/components/shared/home/ProductGridSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import ProductPrice from '../product/product-price'
import Rating from '../product/rating'
import ProductImageHover from '../product/product-image-hover'
import { LeanProduct } from '@/src/types/product'

interface ProductGridSectionProps {
  title: string
  products: LeanProduct[]
  limit?: number
}

export default function ProductGridSection({
  title,
  products,
  limit = 16,
}: ProductGridSectionProps) {
  // Show only the first "limit" items
  const items = products.slice(0, limit)

  if (!items.length) return null

  return (
    <section className="bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={`/search`} className="text-sm text-primary">
          View All
        </Link>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
        {items.map((product) => (
          <div
            key={product.slug}
            className="flex flex-col border rounded-md p-2 hover:shadow-md transition"
          >
            {/* Image with hover */}
            <Link href={`/product/${product.slug}`} className="relative h-48">
              {product.images.length > 1 ? (
                <ProductImageHover
                  src={product.images[0]}
                  hoverSrc={product.images[1]}
                  alt={product.name}
                />
              ) : (
                <Image
                  src={product.images[0] ?? '/images/placeholder.png'}
                  alt={product.name}
                  fill
                  sizes="200px"
                  className="object-contain"
                />
              )}
            </Link>

            {/* Name & Brand */}
            <div className="mt-2 flex-1">
              <p className="text-xs text-muted-foreground">{product.brand}</p>
              <Link
                href={`/product/${product.slug}`}
                className="block text-sm font-medium overflow-hidden text-ellipsis"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {product.name}
              </Link>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 mt-1">
              <Rating rating={product.avgRating} />
              <span className="text-xs text-muted-foreground">
                ({product.numReviews})
              </span>
            </div>

            {/* Price */}
            <div className="mt-2">
              <ProductPrice
                price={product.price}
                listPrice={product.listPrice}
                isDeal={product.tags.includes('todays-deal')}
                forListing
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
