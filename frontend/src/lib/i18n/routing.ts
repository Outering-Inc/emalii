import { defineRouting } from 'next-intl/routing'
import { i18n } from './config/i18n-config'

export const routing = defineRouting({
  locales: i18n.locales.map((l) => l.code),
  defaultLocale: i18n.defaultLocale,
  localePrefix: 'as-needed', // OK with our middleware
})

export type AppLocale = (typeof routing.locales)[number]
