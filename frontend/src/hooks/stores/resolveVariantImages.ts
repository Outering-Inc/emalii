import { LeanProduct } from '@/src/types/product'

export function resolveVariantImages(
  product: LeanProduct,
  color?: string,
  size?: string
): string[] {
  const selectedVariant =
    product.variants?.find(
      v => v.color === color && v.size === size
    ) ?? null
    

  if (selectedVariant?.images?.length) {
    return selectedVariant.images
  }

  return product.images ?? []
}
