import { Metadata } from 'next'
import WebPageList from './webPageList'
import AdminLayout from '@/src/components/shared/admin/adminLayout'

export const metadata: Metadata = {
  title: 'Admin WebPages',
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
