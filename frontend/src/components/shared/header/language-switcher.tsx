'use client'

import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu'
import { useLocale } from 'next-intl'
import { ChevronDownIcon } from 'lucide-react'
import { Link, usePathname } from '@/src/lib/i18n/routing'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { setCurrencyOnServer } from '@/src/lib/actions/admin/setting'
import { i18n } from '@/src/lib/i18n/config/i18n-config'


export default function LanguageSwitcher() {
  const { locales } = i18n
  const locale = useLocale()
  const pathname = usePathname()

  const {
    setting: { availableCurrencies, currency },
    setCurrency,
  } = useSettingStore()
  const handleCurrencyChange = async (newCurrency: string) => {
    await setCurrencyOnServer(newCurrency)
    setCurrency(newCurrency)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='header-button h-[41px]'>
        <div className='flex items-center gap-1'>
          <span className='text-xl'>
            {locales.find((l) => l.code === locale)?.icon}
          </span>
          {locale.toUpperCase().slice(0, 2)}
          <ChevronDownIcon />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56'>
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale}>
          {locales.map((c) => (
            <DropdownMenuRadioItem key={c.name} value={c.code}>
              <Link
                className='w-full flex items-center gap-1'
                href={pathname}
                locale={c.code}
              >
                <span className='text-lg'>{c.icon}</span> {c.name}
              </Link>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Currency</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={currency}
          onValueChange={handleCurrencyChange}
        >
          {availableCurrencies.map((c) => (
            <DropdownMenuRadioItem key={c.name} value={c.code}>
              {c.symbol} {c.code}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}