'use client'

import { CarouselInput } from '@/src/types'
import VideoCardSection from './videoCardSection'
import { HomeCarousel } from './home-carousel'

interface Props {
  items: CarouselInput[]
}

export default function HomeHeroMediaSection({ items }: Props) {
  return (
    <section className="w-full bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT — HERO */}
          <div className="lg:col-span-8">
            <HomeCarousel items={items} />
          </div>

          {/* RIGHT — VIDEO */}
          <div className="lg:col-span-4 flex justify-center">
            <VideoCardSection />
          </div>

        </div>
      </div>
    </section>
  )
}
