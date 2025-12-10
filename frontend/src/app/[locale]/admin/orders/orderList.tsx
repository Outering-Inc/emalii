import Link from 'next/link'
import { auth } from '@/src/lib/auth'
import { adminDeleteOrder, adminGetAllOrders } from '@/src/lib/actions/admin/order'
import { formatDateTime, formatId } from '@/src/lib/utils/utils'
import { OrderList } from '@/src/types'
import { Button } from '@/src/components/ui/button'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from '@/src/components/ui/table'
import ProductPrice from '@/src/components/shared/product/product-price'
import DeleteDialog from '@/src/components/shared/common/deleteDialog'
import Pagination from '@/src/components/shared/common/pagination'


export default async function OrderListPage({ page }: { page: string }) {
  const pageNumber = Number(page) || 1
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')

  const orders = await adminGetAllOrders({ page: pageNumber })

  return (
    <div className='space-y-2'>
      <h1 className='h1-bold'>Orders</h1>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.map((order: OrderList) => (
              <TableRow key={order._id}>
                <TableCell>{formatId(order._id)}</TableCell>
                <TableCell>{formatDateTime(order.createdAt!).dateTime}</TableCell>
                <TableCell>{order.user ? order.user.name : 'Deleted User'}</TableCell>
                <TableCell><ProductPrice price={order.totalPrice} plain /></TableCell>
                <TableCell>
                  {order.isPaid && order.paidAt
                    ? formatDateTime(order.paidAt).dateTime
                    : 'No'}
                </TableCell>
                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatDateTime(order.deliveredAt).dateTime
                    : 'No'}
                </TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/orders/${order._id}`}>Details</Link>
                  </Button>
                  <DeleteDialog id={order._id} action={adminDeleteOrder} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {orders.totalPages && orders.totalPages > 1 && (
          <Pagination page={pageNumber.toString()} totalPages={orders.totalPages} />
        )}
      </div>
    </div>
  )
}
