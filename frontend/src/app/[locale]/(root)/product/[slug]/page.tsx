import { auth } from '@/src/lib/auth'
import AddToCart from '@/src/components/shared/product/add-to-cart'
import { Card, CardContent } from '@/src/components/ui/card'
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from '@/src/lib/actions/productActions'

import SelectVariant from '@/src/components/shared/product/select-variant'
import ProductPrice from '@/src/components/shared/product/product-price'
import ProductGallery from '@/src/components/shared/product/product-gallery'
import { Separator } from '@/src/components/ui/separator'

import ProductSlider from '@/src/components/shared/product/product-slider'
import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import AddToBrowsingHistory from '@/src/components/shared/product/add-to-browsing-history'
import { generateId, round2 } from '@/src/lib/utils/utils'
import RatingSummary from '@/src/components/shared/product/rating-summary'
import ReviewList from './review-list'
import { getTranslations } from 'next-intl/server'
import { features } from 'process'

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ color?: string; size?: string }>
}) {
  const t = await getTranslations()
  const params = await props.params
  const searchParams = await props.searchParams
  const product = await getProductBySlug((await params).slug)

  if (!product) {
    return {
      title: t('Product.Product not found'),
      description: t('Product.The requested product could not be found'),
      alternatives: {
        canonical: `https://emalii.com/product/${(await params).slug}`,
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

export default async function ProductDetails(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; color?: string; size?: string }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  const { slug } = await params
  const { page, color, size } = searchParams

  const session = await auth()
  const product = await getProductBySlug(slug)

  if (!product) return <div>Product not found</div>

  const t = await getTranslations()

  // ✅ SERVER-SIDE VARIANT RESOLUTION
  const selectedColor =
    color && product.colors.includes(color) ? color : product.colors[0]
  const selectedSize =
    size && product.sizes.includes(size) ? size : product.sizes[0]

  const variantImages = product.variantImages?.[selectedColor]
  const images =
    variantImages && variantImages.length > 0
      ? variantImages
      : product.images

  // 🔥 RELATED PRODUCTS
  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category,
    productId: product._id,
    page: Number(page || '1'),
  })

  const structureData = {
    '@context': 'http://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images[0],
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand },
    category: product.category,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.avgRating,
      ratingCount: product.numReviews,
      bestRating: '5',
      worstRating: '1',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability:
        product.countInStock > 0
          ? 'http://schema.org/InStock'
          : 'http://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Emalii.com' },
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Color', value: selectedColor },
      { '@type': 'PropertyValue', name: 'Size', value: selectedSize },
      { '@type': 'PropertyValue', name: 'Features', value: features },
    ],
  }

  // 🔥 PRELOAD VARIANT IMAGES
  const preloadImages = () => {
    product.colors.forEach((color) => {
      product.variantImages?.[color]?.forEach((img) => {
        const image = new Image()
        image.src = img
      })
    })
  }

  preloadImages()

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structureData) }}
      />
      <AddToBrowsingHistory id={product._id} category={product.category} />

      <section>
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Product Gallery */}
          <div className="col-span-2">
            <ProductGallery images={images} />
          </div>

          {/* Product Details */}
          <div className="flex w-full flex-col gap-2 md:p-5 col-span-2">
            <div className="flex flex-col gap-3">
              <p className="p-medium-16 rounded-full bg-grey-500/10 text-grey-500">
                {t('Product.Brand')} {product.brand} {product.category}
              </p>
              <h1 className="font-bold text-lg lg:text-xl">{product.name}</h1>

              <RatingSummary
                avgRating={product.avgRating}
                numReviews={product.numReviews}
                asPopover
                ratingDistribution={product.ratingDistribution}
              />

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex gap-3">
                  <ProductPrice
                    price={product.price}
                    listPrice={product.listPrice}
                    isDeal={product.tags.includes('todays-deal')}
                    forListing={false}
                  />
                </div>
              </div>
            </div>

            {/* 🔥 VARIANT SELECTION */}
            <div>
              <SelectVariant
                product={product}
                size={selectedSize}
                color={selectedColor}
                disableOutOfStock
              />
            </div>

            <Separator className="my-2" />

            <div className="flex flex-col gap-2">
              <p className="p-bold-20 text-grey-600">{t('Product.Description')}:</p>
              <p className="p-medium-16 lg:p-regular-18">{product.description}</p>
            </div>
          </div>

          {/* Cart Section */}
          <div>
            <Card>
              <CardContent className="p-4 flex flex-col gap-4">
                <ProductPrice price={product.price} />

                {product.countInStock > 0 && product.countInStock <= 3 && (
                  <div className="text-destructive font-bold">
                    {t('Product.Only X left in stock - order soon', { count: product.countInStock })}
                  </div>
                )}

                {product.countInStock !== 0 ? (
                  <div className="text-green-700 text-xl">{t('Product.In Stock')}</div>
                ) : (
                  <div className="text-destructive text-xl">{t('Product.Out of Stock')}</div>
                )}

                {product.countInStock !== 0 && (
                  <div className="flex justify-center items-center">
                    <AddToCart
                      item={{
                        clientId: generateId(),
                        product: product._id,
                        countInStock: product.countInStock,
                        name: product.name,
                        slug: product.slug,
                        category: product.category,
                        price: round2(product.price),
                        quantity: 1,
                        image: images[0],
                        size: selectedSize,
                        color: selectedColor,
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="mt-10">
        <h2 className="h2-bold mb-2" id="reviews">
          {t('Product.Customer Reviews')}
        </h2>
        <ReviewList product={product} userId={session?.user.id} />
      </section>

      {/* Related Products */}
      <section className="mt-10">
        <ProductSlider
          products={relatedProducts.data}
          title={t('Product.Best Sellers in', { name: product.category })}
        />
      </section>

      {/* Browsing History */}
      <section>
        <BrowsingHistoryList className="mt-10" />
      </section>
    </div>
  )
}
