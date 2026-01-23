'use client'

import { Button } from '@/src/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip'
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
  // ✅ Always render selectors if colors/sizes exist
  const hasColors = product.colors.length > 0
  const hasSizes = product.sizes.length > 0

  const selectedColor = color || product.colors[0] || ''
  const selectedSize = size || product.sizes[0] || ''

  const variants = product.variants ?? []

  const getVariant = (c: string, s: string) =>
    variants.find(v => v.color === c && v.size === s)

  const firstAvailableSizeForColor = (c: string) =>
    product.sizes.find(s => {
      const v = getVariant(c, s)
      return v && v.stock > 0
    }) ?? product.sizes[0]

  const isColorOutOfStock = (c: string) => {
    if (!disableOutOfStock) return false
    return variants.filter(v => v.color === c).every(v => v.stock === 0)
  }

  const isSizeOutOfStock = (s: string) => {
    if (!disableOutOfStock) return false
    const v = getVariant(selectedColor, s)
    return !v || v.stock === 0
  }

  const selectedVariant = getVariant(selectedColor, selectedSize)
  const canSelect =
    selectedVariant && selectedVariant.stock > 0 && selectedColor && selectedSize

  return (
    <TooltipProvider>
      <div className="mt-3 space-y-3">
        <div className="grid grid-cols-2 gap-4">
          {/* ---------- COLORS ---------- */}
          {hasColors && (
            <div>
              <p className="text-xs font-medium mb-1">
                Color:{' '}
                <span className="font-normal capitalize">{selectedColor}</span>
              </p>

              <div className="flex gap-2 flex-wrap">
                {product.colors.map(c => {
                  const disabled = isColorOutOfStock(c)
                  return (
                    <Tooltip key={c}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={disabled}
                          style={{ backgroundColor: c }}
                          className={`h-7 w-7 p-0 rounded-full border ${
                            selectedColor === c ? 'ring-2 ring-primary' : ''
                          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                          onClick={() => {
                            if (disabled) return
                            const nextSize = firstAvailableSizeForColor(c)
                            onChange?.({ color: c, size: nextSize })
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        {disabled ? 'Out of stock' : c}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )}

          {/* ---------- SIZES ---------- */}
          {hasSizes && (
            <div>
              <p className="text-xs font-medium mb-1">
                Size:{' '}
                <span className="font-normal uppercase">{selectedSize}</span>
              </p>

              <div className="grid grid-cols-4 gap-1">
                {product.sizes.map(s => {
                  const disabled = isSizeOutOfStock(s)
                  return (
                    <Tooltip key={s}>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant={selectedSize === s ? 'default' : 'outline'}
                          disabled={disabled}
                          className={`px-2 ${
                            disabled ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          onClick={() => {
                            if (disabled) return
                            onChange?.({ color: selectedColor, size: s })
                          }}
                        >
                          {s.toUpperCase()}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {disabled
                          ? 'Unavailable'
                          : (() => {
                              const v = getVariant(selectedColor, s)
                              return v && v.stock <= 5
                                ? `Only ${v.stock} left`
                                : 'In stock'
                            })()}
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* ---------- STOCK MESSAGE ---------- */}
        {!canSelect && (
          <p className="text-sm text-destructive">
            Please select an available color and size
          </p>
        )}
      </div>
    </TooltipProvider>
  )
}
