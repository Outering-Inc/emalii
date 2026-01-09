'use client'

import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import { LeanProduct } from '@/src/types/product'

interface SelectVariantProps {
  product: LeanProduct
  color?: string
  size?: string
  disableOutOfStock?: boolean
  onChange?: (variant: { color: string; size: string }) => void
}

export default function SelectVariantCategory({
  product,
  color,
  size,
  disableOutOfStock = false,
  onChange,
}: SelectVariantProps) {
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  /**
   * ✅ Check if a COLOR is out of stock
   * A color is disabled if ALL its sizes are out of stock
   */
  const isColorOutOfStock = (c: string) => {
    if (!disableOutOfStock || !product.variants?.length) return false

    const variantsForColor = product.variants.filter(
      (v) => v.color === c
    )

    if (variantsForColor.length === 0) return true

    return variantsForColor.every((v) => v.stock === 0)
  }

  /**
   * ✅ Check if a SIZE is out of stock for the selected color
   */
  const isSizeOutOfStock = (s: string) => {
    if (!disableOutOfStock || !product.variants?.length) return false

    const variant = product.variants.find(
      (v) => v.color === selectedColor && v.size === s
    )

    return !variant || variant.stock === 0
  }

  return (
    <div className="space-y-2">
      {/* COLORS */}
      {product.colors.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">
            Color
          </p>

          <div className="flex gap-2 justify-center flex-wrap">
            {product.colors.map((c) => {
              const disabled = isColorOutOfStock(c)

              return (
                <Button
                  key={c}
                  asChild
                  variant="outline"
                  disabled={disabled}
                  className={`h-7 w-7 p-0 rounded-full ${
                    selectedColor === c
                      ? 'ring-2 ring-primary'
                      : ''
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() =>
                    !disabled &&
                    onChange?.({ color: c, size: selectedSize })
                  }
                >
                  <Link
                    replace
                    scroll={false}
                    href={`?${new URLSearchParams({
                      color: c,
                      size: selectedSize,
                    })}`}
                    aria-label={c}
                  >
                    <span
                      className="h-4 w-4 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* SIZES */}
      {product.sizes.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground text-center">
            Size
          </p>

          <div className="flex gap-1 flex-wrap justify-center">
            {product.sizes.map((s) => {
              const disabled = isSizeOutOfStock(s)

              return (
                <Button
                  key={s}
                  asChild
                  size="sm"
                  disabled={disabled}
                  variant={
                    selectedSize === s ? 'default' : 'outline'
                  }
                  className={disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  onClick={() =>
                    !disabled &&
                    onChange?.({ color: selectedColor, size: s })
                  }
                >
                  <Link
                    replace
                    scroll={false}
                    href={`?${new URLSearchParams({
                      color: selectedColor,
                      size: s,
                    })}`}
                  >
                    {s.toUpperCase()}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
