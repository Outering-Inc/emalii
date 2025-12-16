import BrowsingHistoryList from '@/src/components/shared/common/browsing-history-list'
import { HomeCard } from '@/src/components/shared/home/home-card'
import HomeHeroMediaSection from '@/src/components/shared/home/HomeHeroMediaSection'
import ProductGridSection from '@/src/components/shared/home/ProductGridSection'
import ProductSlider from '@/src/components/shared/product/product-slider'
import { Card, CardContent } from '@/src/components/ui/card'
import { getSetting } from '@/src/lib/actions/admin/setting'
import {
  getAllCategories,
  getProductsByTag,
  getProductsForCard,
} from '@/src/lib/actions/productActions'
import { toSlug } from '@/src/lib/utils/utils'
import { getTranslations } from 'next-intl/server'


export default async function HomePage() {
  const t = await getTranslations('Home')
  const { carousels } = await getSetting()

  const todaysDeals = await getProductsByTag({ tag: 'todays-deal' })
  const bestSellingProducts = await getProductsByTag({ tag: 'best-seller' })

  const categories = (await getAllCategories()).slice(0, 4)
  const newArrivals = await getProductsForCard({ tag: 'new-arrival' })
  const featureds = await getProductsForCard({ tag: 'featured' })
  const bestSellers = await getProductsForCard({ tag: 'best-seller' })

  const trusted = (await getAllCategories()).slice(0, 4)
  const fastMoving = await getProductsForCard({ tag: 'fast-moving' })
  const approvals = await getProductsForCard({ tag: 'approvals' })
  const premium = await getProductsForCard({ tag: 'premium' })
  

  const cards = [
    {
      title: t('Categories to explore'),
      link: { text: t('See More'), href: '/search' },
      items: categories.map((category) => ({
        name: category,
        image: `/images/${toSlug(category)}.jpg`,
        href: `/search?category=${category}`,
      })),
      limit : 4,
    },
    {
      title: t('Explore New Arrivals'),
      items: newArrivals,
      link: { text: t('View All'), href: '/search?tag=new-arrival' },
      limit : 4,
    },
    {
      title: t('Discover Best Sellers'),
      items: bestSellers,
      link: { text: t('View All'), href: '/search?tag=best-seller' },
      limit : 4,
    },
    {
      title: t('Featured Products'),
      items: featureds,
      link: { text: t('Shop Now'), href: '/search?tag=featured' },
      limit : 4,
    },
    
  ]
  
   const card2 = [
    {
      title: t('The Elephant Edition'),
      link: { text: t('See More'), href: '/search' },
      items: trusted.map((trust) => ({
        name: trust,
        image: `/images/${toSlug(trust)}.jpg`,
        href: `/search?trust=${trust}`,
      })),
      limit : 4,
    },
    {
      title: t('The Cheetah Drop'),
      items: fastMoving,
      link: { text: t('View All'), href: '/search?tag=fast-moving' },
      limit: 4,
    },
    {
      title: t('The Buffalo Choice'),
      items: approvals,
      link: { text: t('View All'), href: '/search?tag=approvals' },
      limit: 4,
    },
    {
      title: t('The Lion Collection'),
      items: premium,
      link: { text: t('Shop Now'), href: '/search?tag=premium' },
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
        <ProductGridSection
          titleKey="The Rhino Deals"
          tag="power-discount"
          viewAllHref="/search?tag=power-discount"
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
