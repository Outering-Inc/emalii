// src/app/page.tsx
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

// List your supported locales
const SUPPORTED_LOCALES = ['en-US', 'fr', 'ar', 'sw'] as const;
const DEFAULT_LOCALE = 'en-US';

export default async function RootPage() {
  const headersList = await headers(); // <-- await here
  const acceptLang = headersList.get('accept-language') || '';
  
  // Extract first language
  const userLocale = acceptLang.split(',')[0].toLowerCase();

  // Find matching locale or fallback
  const matchedLocale =
    SUPPORTED_LOCALES.find((loc) => userLocale.startsWith(loc.toLowerCase())) ||
    DEFAULT_LOCALE;

  redirect(`/${matchedLocale}`);
}
