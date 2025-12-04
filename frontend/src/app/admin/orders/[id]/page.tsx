import { notFound } from 'next/navigation'
import React from 'react'


import Link from 'next/link'
import { auth } from '@/src/lib/auth'
import { adminGetOrderById } from '@/src/app/api/admin/orders/[id]/route'
import OrderDetailsForm from '@/src/components/shared/order/orderDetailForm'

export const metadata = {
  title: 'Admin Order Details',
}

const AdminOrderDetailsPage = async (props: {
  params: Promise<{
    id: string
  }>
}) => {
  const params = await props.params

  const { id } = params

  const order = await adminGetOrderById(id)
  if (!order) notFound()

  const session = await auth()

  return (
    <main className='max-w-6xl mx-auto p-4'>
      <div className='flex mb-4'>
        <Link href='/admin/orders'>Orders</Link> <span className='mx-1'>›</span>
        <Link href={`/admin/orders/${order._id}`}>{order._id}</Link>
      </div>
      <OrderDetailsForm
        order={order}
        isAdmin={session?.user?.role === 'Admin' || false}
      />
    </main>
  )
}

export default AdminOrderDetailsPage