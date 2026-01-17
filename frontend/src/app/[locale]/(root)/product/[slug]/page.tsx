// app/[locale]/product/[slug]/page.tsx

import { auth } from '@/src/lib/auth'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/src/lib/actions/productActions'
import { getTranslations } from 'next-intl/server'
import ProductDetailsClient from './product-detail-client'


export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ color?: string; size?: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const searchParams = await props.searchParams
  const product = await getProductBySlug(params.slug)

  if (!product) {
    return {
      title: t('Product.Product not found'),
      description: t('Product.The requested product could not be found'),
      alternatives: {
        canonical: `https://emalii.com/product/${params.slug}`,
      },
    }
  }

  const color =
    searchParams?.color && product.colors.includes(searchParams.color)
      ? searchParams.color
      : undefined

  return {
    title: color
      ? `${product.name} – ${color} | ${product.brand}`
      : `${product.name} - ${product.brand} | Emalii.com`,
    description: `${product.description} Price: $${product.price}.`,
    openGraph: {
      images:
        color && product.variantImages?.[color]?.[0]
          ? product.variantImages[color][0]
          : product.images[0],
    },
  }
}

export default async function Page(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; color?: string; size?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams

  const session = await auth()
  const product = await getProductBySlug(params.slug)

  if (!product) return <div>Product not found</div>

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(searchParams.page || '1'),
  })

  return (
    <ProductDetailsClient
      product={product}
      relatedProducts={relatedProducts}
      userId={session?.user?.id}
      searchParams={searchParams}
    />
  )
}
