// src/components/shared/home/CategoryGridSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { getCategoryGrid } from '@/src/lib/actions/productActions'
import { getTranslations } from 'next-intl/server'
import DiscountBadge from '../common/discountBadge'
//import DiscountBadge from '@/src/components/shared/product/DiscountBadge'

interface CategoryGridSectionProps {
  title: string
  viewAllHref: string
  limit?: number
}

export default async function CategoryGridSection({
  title,
  viewAllHref,
  limit = 16,
}: CategoryGridSectionProps) {
  const t = await getTranslations('Home')
  const allItems = await getCategoryGrid()
  const items = allItems.slice(0, limit)

  if (!items.length) return null

  return (
    <section className="bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t(title)}</h2>
        <Link href={viewAllHref} className="text-sm text-primary">
          {t('View All')}
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col">
            <div className="relative aspect-square bg-muted flex items-center justify-center">
              {/* 🔥 Discount badge */}
              <DiscountBadge
                price={item.price}
                listPrice={item.listPrice}
              />

              <Image
                src={item.image}
                alt={item.name}
                width={120}
                height={120}
                className="aspect-square object-contain"
              />
            </div>

            <p className="mt-2 text-sm text-center truncate">
              {item.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
