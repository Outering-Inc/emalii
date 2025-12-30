import ReactMarkdown from 'react-markdown'
import { notFound } from 'next/navigation'
import { getWebPageBySlug } from '@/src/lib/actions/admin/webPages'


// ------------------- METADATA -------------------
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params

  const { slug } = params

  const webPage = await getWebPageBySlug(slug)
  if (!webPage) {
    return { 
      title: 'Web page not found',
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
    alternatives: {
      cannonical: "https://emalii.com/page/${slug}"
    }
  }
}

// ------------------- PAGE -------------------
export default async function ProductDetailsPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page: string; color: string; size: string }>
}) {
  const params = await props.params
  const { slug } = params
  const webPage = await getWebPageBySlug(slug)

  if (!webPage) notFound()

  return (
    <div className='p-4 max-w-3xl mx-auto'>
      <h1 className='h1-bold py-4'>{webPage.title}</h1>
      <section className='text-justify text-lg mb-20 web-page-content'>
        <ReactMarkdown>{webPage.content}</ReactMarkdown>
      </section>
    </div>
  )
}