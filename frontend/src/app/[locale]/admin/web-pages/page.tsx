import { Metadata } from 'next'
import WebPageList from './webPageList'
import AdminLayout from '@/src/components/shared/admin/adminLayout'

export const metadata: Metadata = {
  title: 'Admin Web Page | Emalii Admin',
  description: 'Admin interface for Mmanaging website pages.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
export default async function AdminUsersPage(props: {
  searchParams: Promise <{ page?: string }>
}) {
  const searchParams = await props.searchParams
   const { page = '1' } = searchParams

  return (
    <AdminLayout>
      <WebPageList page={page} />
    </AdminLayout>
  )
}
