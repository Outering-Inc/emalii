// src/components/shared/home/TaggedProductSection.tsx
import { HomeCard } from '@/src/components/shared/home/home-card'
import { getProductsForCard } from '@/src/lib/actions/productActions'
import { getTranslations } from 'next-intl/server'

interface TaggedProductSectionProps {
  titleKey: string
  tag: string
  viewAllHref: string
  limit?: number
}

export default async function TaggedProductSection({
  titleKey,
  tag,
  viewAllHref,
  limit = 16,
}: TaggedProductSectionProps) {
  const t = await getTranslations('Home')

  // Fetch products
  const products = await getProductsForCard({ tag })

  // Ensure only 16 items are returned
  const items = products.slice(0, limit)

  if (!items.length) return null

  return (
    <HomeCard
      cards={[
        {
          title: t(titleKey),
          items,
          link: {
            text: t('View All'),
            href: viewAllHref,
          },
        },
      ]}
    />
  )
}
