import createMiddleware from 'next-intl/middleware'
import { routing } from './lib/i18n/routing'

import NextAuth from 'next-auth'
import authConfig from '@/auth.config'

import type { NextAuthRequest } from 'next-auth'
import { NextResponse } from 'next/server'

/**
 * Public routes (WITHOUT locale)
 */
const publicPages = [
  '/',
  '/search',
  '/sign-in',
  '/sign-up',
  '/cart',
  '/cart/(.*)',
  '/product/(.*)',
  '/page/(.*)',
]

/**
 * next-intl middleware
 */
const intlMiddleware = createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: 'as-needed',
})

const { auth } = NextAuth(authConfig)

export default auth((req: NextAuthRequest) => {
  const { pathname } = req.nextUrl

  /**
   * 1️⃣ Skip API & static files
   */
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  /**
   * 2️⃣ Check if locale exists in URL
   */
  const hasLocale = routing.locales.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  /**
   * 3️⃣ No locale → let next-intl detect browser language
   */
  if (!hasLocale) {
    return intlMiddleware(req)
  }

  /**
   * 4️⃣ Remove locale to check public routes
   */
  const pathnameWithoutLocale = pathname.replace(
    new RegExp(`^/(${routing.locales.join('|')})`),
    ''
  )

  const publicRegex = new RegExp(
    `^(${publicPages
      .flatMap((p) => (p === '/' ? ['', '/'] : p))
      .join('|')})/?$`,
    'i'
  )

  const isPublicPage = publicRegex.test(pathnameWithoutLocale)

  /**
   * 5️⃣ Public pages → allow access
   */
  if (isPublicPage) {
    return intlMiddleware(req)
  }

  /**
   * 6️⃣ Protected pages → require auth
   */
  if (!req.auth) {
    const signInUrl = new URL('/sign-in', req.nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  /**
   * 7️⃣ Authenticated → continue
   */
  return intlMiddleware(req)
})

/**
 * Middleware matcher
 */
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
