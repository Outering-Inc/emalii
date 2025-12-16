// src/components/shared/home/ProductGridSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { getProductsForCard } from '@/src/lib/actions/productActions'
import { getTranslations } from 'next-intl/server'

interface ProductGridSectionProps {
  titleKey: string
  tag: string
  viewAllHref: string
  limit?: number
}

export default async function ProductGridSection({
  titleKey,
  tag,
  viewAllHref,
  limit = 16,
}: ProductGridSectionProps) {
  const t = await getTranslations('Home')
  const products = await getProductsForCard({ tag })

  const items = products.slice(0, limit)

  if (!items.length) return null

  return (
    <section className="bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t(titleKey)}</h2>
        <Link href={viewAllHref} className="text-sm text-primary">
          {t('View All')}
        </Link>
      </div>

      {/* 16-item rectangle */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col"
          >
            <div className="aspect-square bg-muted flex items-center justify-center">
              <Image
                src={item.image ?? '/images/placeholder.png'}
                alt={item.name}
                width={120}
                height={120}
                className="object-contain"
              />
            </div>

            <p className="mt-2 text-sm truncate text-center">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
