import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import CategoryGridSection from '@/src/components/shared/home/CategoryGridSection'
import { HomeCard } from '@/src/components/shared/home/home-card'
import HomeHeroMediaSection from '@/src/components/shared/home/HomeHeroMediaSection'

import ProductSlider from '@/src/components/shared/product/product-slider'
import { Card, CardContent } from '@/src/components/ui/card'
import { getSetting } from '@/src/lib/actions/admin/setting'
import {

  getCategoryGridByTag,
  getProductsByTag,
  getProductsForCard,
} from '@/src/lib/actions/productActions'
import { getTranslations } from 'next-intl/server'


export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()

  const todaysDeals = await getProductsByTag({ tag: 'todays-deal' })
  const bestSellingProducts = await getProductsByTag({ tag: 'best-seller' })

  const categories =  await getCategoryGridByTag({tag: 'category-explore'})
  const newArrivals = await getProductsForCard({ tag: 'new-arrival' })
  const featureds = await getCategoryGridByTag({ tag: 'featured' })
  const bestSellers = await getCategoryGridByTag({ tag: 'best-seller' })

  const powerDiscount = await getCategoryGridByTag({tag: 'power-discount'})
  const fastMoving = await getCategoryGridByTag({tag: 'fast-moving'})
  const approvals = await getCategoryGridByTag({tag: 'approvals'})
  const premium = await getCategoryGridByTag({tag: 'premium'})


  
  const cards = [
     {
    title: t('Categories to explore'),
    link: { text: t('See More'), href: '/search?tag=category-explore' },
    items: categories,
    limit: 4,
    },
    {
      title: t('Explore New Arrivals'),
      items: newArrivals,
      link: { text: t('View All'),href: '/search?tag=new-arrival' },
      limit : 4,
    },
    {
      title: t('Discover Best Sellers'),
      items: bestSellers,
      link: { text: t('View All'), href: '/search?tag=best-seller' },
      limit : 4,
    },
    {
      title: t('Featured Favorites'),
      items: featureds,
      link: { text: t('Shop Now'), href: '/search?tag=featured' },
      limit : 4,
    },
    
  ]
  
 const card2 = [
  {
    title: t('Powerful Deals'),
    link: { text: t('See More'), href: '/search?tag=power-discount' },
    items: powerDiscount,
    limit: 4,
  },
  {
    title: t('Fast-Moving Trends'),
    link: { text: t('View All'), href: '/search?tag=fast-moving' },
    items: fastMoving,
    limit: 4,
  },
  {
    title: t('Approved by Customers'),
    link: { text: t('View All'), href: '/search?tag=approvals' },
    items: approvals,
    limit: 4,
  },
  {
    title: t('Premium Quality'),
    link: { text: t('View All'), href: '/search?tag=premium' },
    items: premium,
    limit: 4,
  },
]

 
  return (
    <>
      {/* ✅ HERO MEDIA SECTION */}
      <HomeHeroMediaSection items={carousels} />

      <div className="md:p-4 md:space-y-4 bg-border">
        <HomeCard cards={cards} />
        <HomeCard cards={card2} />
       <CategoryGridSection
          limit={16}
          title="Categories to Explore"
          viewAllHref="/search"
        />


        <Card className="w-full rounded-none">
          <CardContent className="p-4">
            <ProductSlider title={t("Today's Deals")} products={todaysDeals} />
          </CardContent>
        </Card>

        <Card className="w-full rounded-none">
          <CardContent className="p-4">
            <ProductSlider
              title={t('Best Selling Products')}
              products={bestSellingProducts}
              hideDetails
            />
          </CardContent>
        </Card>
      </div>

      <div className="p-4 bg-background">
        <BrowsingHistoryList />
      </div>
    </>
  )
}