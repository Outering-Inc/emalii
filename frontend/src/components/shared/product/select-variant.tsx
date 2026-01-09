'use client'

import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { LeanProduct, ProductVariant } from '@/src/types/product'

interface SelectVariantProps {
  product: LeanProduct
  color?: string
  size?: string
  disableOutOfStock?: boolean
}

export default function SelectVariant({
  product,
  color,
  size,
  disableOutOfStock = true,
}: SelectVariantProps) {
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  /* -----------------------------
     Helpers
  ------------------------------ */

  const variants = product.variants ?? []

  const variantsByColor = (c: string) =>
    variants.filter((v) => v.color === c)

  const variantByColorAndSize = (
    c: string,
    s: string
  ): ProductVariant | undefined =>
    variants.find((v) => v.color === c && v.size === s)

  /* -----------------------------
     Stock Rules (Amazon-style)
  ------------------------------ */

  // A color is out of stock if ALL its sizes have stock === 0
  const isColorOutOfStock = (c: string) => {
    if (!disableOutOfStock || variants.length === 0) return false
    const byColor = variantsByColor(c)
    return byColor.length === 0 || byColor.every((v) => v.stock === 0)
  }

  // A size is out of stock for the selected color
  const isSizeOutOfStock = (s: string) => {
    if (!disableOutOfStock || variants.length === 0) return false
    const variant = variantByColorAndSize(selectedColor, s)
    return !variant || variant.stock === 0
  }

  /* -----------------------------
     UI
  ------------------------------ */


  return (
    <>
      {product.colors.length > 0 && (
        <div className="space-x-2 space-y-2">
          <div>Color:</div>
          {product.colors.map((x: string) => {
            const outOfStock = isColorOutOfStock(x)
            return (
              <Button
                asChild
                variant="outline"
                className={selectedColor === x ? 'border-2 border-primary' : 'border-2'}
                key={x}
                disabled={outOfStock}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: x,
                    size: selectedSize,
                  })}`}
                >
                  <div
                    style={{ backgroundColor: x }}
                    className={`h-4 w-4 rounded-full border border-muted-foreground ${
                      outOfStock ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  ></div>
                  {x}
                </Link>
              </Button>
            )
          })}
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mt-2 space-x-2 space-y-2">
          <div>Size:</div>
          {product.sizes.map((x: string) => {
            const outOfStock = isSizeOutOfStock(x)
            return (
              <Button
                asChild
                variant="outline"
                className={`${selectedSize === x ? 'border-2 border-primary' : 'border-2'} ${
                  outOfStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                key={x}
                disabled={outOfStock}
              >
                <Link
                  replace
                  scroll={false}
                  href={`?${new URLSearchParams({
                    color: selectedColor,
                    size: x,
                  })}`}
                >
                  {x}
                </Link>
              </Button>
            )
          })}
        </div>
      )}
    </>
  )
}
