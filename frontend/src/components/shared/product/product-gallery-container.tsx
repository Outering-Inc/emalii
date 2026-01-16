'use client'

import { useSearchParams } from 'next/navigation'
import { LeanProduct } from '@/src/types/product'
import ProductGallery from './product-gallery'
import { resolveVariantImages } from '@/src/hooks/stores/resolveVariantImages'


interface Props {
  product: LeanProduct
}

export default function ProductGalleryContainer({ product }: Props) {
  const searchParams = useSearchParams()

  const color =
    searchParams.get('color') && product.colors?.includes(searchParams.get('color')!)
      ? searchParams.get('color')!
      : product.colors?.[0]

  const size =
    searchParams.get('size') && product.sizes?.includes(searchParams.get('size')!)
      ? searchParams.get('size')!
      : product.sizes?.[0]

  const images = resolveVariantImages(product, color, size)

  return <ProductGallery images={images} />
}
