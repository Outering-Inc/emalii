// file: app/admin/orders/page.tsx
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import OrderListPage from './orderList'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Orders Page',
}
export default async function AdminOrdersPage(props: {
  searchParams: Promise <{ page?: string }>
}) {
  const searchParams = await props.searchParams
   const { page = '1' } = searchParams

  return (
    <AdminLayout>
      <OrderListPage page={page} />
    </AdminLayout>
  )
}
