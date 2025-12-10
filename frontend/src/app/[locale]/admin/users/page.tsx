
import AdminLayout from '@/src/components/shared/admin/adminLayout'

import { Metadata } from 'next'
import UserList from './userList'

export const metadata: Metadata = {
  title: 'Admin Users Page',
}
export default async function AdminUsersPage(props: {
  searchParams: Promise <{ page?: string }>
}) {
  const searchParams = await props.searchParams
   const { page = '1' } = searchParams

  return (
    <AdminLayout>
      <UserList page={page} />
    </AdminLayout>
  )
}
