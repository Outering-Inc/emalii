// src/app/[locale]/(root)/page/[slug]/page.tsx
import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import { getWebPageBySlug } from '@/src/lib/actions/admin/webPages'
import { Metadata } from 'next'

// ------------------- METADATA -------------------
export async function generateMetadata({
  params,
}: {
  params: { slug: string } // <-- plain object, not Promise
}): Promise<Metadata> {
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) {
    return {
      title: 'Page Not Found',
      description: 'The requested page could not be found',
      robots: { index: false, follow: false },
    }
  }

  const url = `https://emalii.com/${slug}` //canonical URL

  return {
    title: webPage.title,
    description: webPage.description || undefined,
    keywords: webPage.keywords?.join(', '),
    alternates: { canonical: url },
    openGraph: {
      title: webPage.title,
      description: webPage.description || undefined,
      siteName: 'Emalii.com',
      type: 'website',
      url,
      images: [
        { url: '/emalii.PNG', width: 1200, height: 630, alt: webPage.title },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: webPage.title,
      description: webPage.description || undefined,
      images: ['/emalii.PNG'],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

// ------------------- PAGE COMPONENT -------------------
export default async function WebPageSlug({
  params,
}: {
  params: { slug: string } // <-- plain object
}) {
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: webPage.title,
    description: webPage.description || '',
    url: `https://emalii.com/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="h1-bold py-4">{webPage.title}</h1>
        <section className="text-justify text-lg mb-20 web-page-content">
          <ReactMarkdown>{webPage.content}</ReactMarkdown>
        </section>
      </div>
    </>
  )
}
