import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Card, CardContent, CardFooter } from '@/src/components/ui/card'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    items?: string[]
    image: string
    href: string
  }[]
  limit?: number // <-- optional limit per card
}

export function HomeCard({ cards }: { cards: CardItem[] }) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 md:gap-4'>
      {cards.map((card) => (
        <Card key={card.title} className='rounded-none flex flex-col'>
          <CardContent className='p-4 flex-1'>
            <h3 className='text-xl font-bold mb-4'>{card.title}</h3>

            <div className='grid grid-cols-2 gap-4'>
              {card.items
                .slice(0, card.limit ?? 4)
                .map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className='flex flex-col'
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      height={80}
                      width={80}
                      className='aspect-square object-scale-down mx-auto'
                    />
                    <p className='text-center text-sm truncate'>
                      {item.name}
                    </p>
                  </Link>
                ))}
            </div>
          </CardContent>

          {card.link && (
            <CardFooter>
              <Link href={card.link.href} className='mt-4 block text-sm text-primary'>
                {card.link.text}
              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  )
}
