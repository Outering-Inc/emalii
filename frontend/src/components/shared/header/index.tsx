import Image from 'next/image'
import Link from 'next/link'
import Menu from './menu'
import Sidebar from './sidebar'
import SearchBar from './search/searchBar'
import data from '@/src/lib/data'
import { getTranslations } from 'next-intl/server'
import { getAllCategories } from '@/src/lib/actions/productActions'
import { getSetting } from '@/src/lib/actions/admin/setting'

export default async function Header() {
  const categories = await getAllCategories()
  const { site } = await getSetting()
  const t = await getTranslations()
  return (
    <header className='text-white' style={{ backgroundColor: ' #023430' }}>
      <div  className="px-4 py-2 md:px-6 lg:px-10 xl:px-16">
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              href='/'
              className='flex items-center header-button font-extrabold text-2xl m-1 '
            >
              <Image
                src={site.logo}
                width={40}
                height={40}
                alt={`${site.name} logo`}
              />
              {site.name}
            </Link>
          </div>

          <div className='hidden md:block flex-1 max-w-xl'>
            <SearchBar/>
          </div>
          <Menu />
        </div>
        <div className='md:hidden block py-2'>
          <SearchBar/>
        </div>
      </div>
      <div className='flex items-center px-3 mb-[1px]'style={{ backgroundColor: ' #00593F' }}>
        <Sidebar categories={categories} />
        <div className='flex items-center flex-wrap gap-3 overflow-hidden   max-h-[42px]'>
          {data.headerMenus.map((menu) => (
            <Link
              href={menu.href}
              key={menu.href}
              className='header-button !p-2 '
            >
              {t('Header.' + menu.name)}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}