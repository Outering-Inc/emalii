// src/components/shared/home/ProductGridSection.tsx
import Image from 'next/image'
import Link from 'next/link'
import { getAllCategories } from '@/src/lib/actions/productActions'
import { toSlug } from '@/src/lib/utils/utils'
import { getTranslations } from 'next-intl/server'

interface ProductGridSectionProps {
  title: string
  viewAllHref: string
  limit?: number
}

interface CategoryItem {
  name: string
  image: string
  href: string
}

export default async function ProductGridSection({
  title,
  viewAllHref,
  limit = 16,
}: ProductGridSectionProps) {
  const t = await getTranslations('Home')

  // Fetch categories and limit
  const categories = (await getAllCategories()).slice(0, limit)
  const items: CategoryItem[] = categories.map((category) => ({
    name: category,
    image: `/images/${toSlug(category)}.jpg`,
    href: `/search?trust=${toSlug(category)}`,
  }))

  return (
    <section className="bg-background p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t(title)}</h2>
        <Link href={viewAllHref} className="text-sm text-primary">
          {t('View All')}
        </Link>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8 gap-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center"
          >
            <div className="aspect-square bg-muted flex items-center justify-center rounded">
              <Image
                src={item.image ?? '/images/placeholder.png'}
                alt={item.name}
                width={120}
                height={120}
                className="aspect-square object-scale-down max-w-full h-auto mx-auto"
              />
            </div>
            <p className="mt-2 text-sm truncate text-center">{item.name}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}
