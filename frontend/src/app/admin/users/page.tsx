import { Metadata } from 'next'
import Link from 'next/link'

import { auth } from '@/src/lib/auth'
import DeleteDialog from '@/src/components/shared/common/deleteDialog'
import Pagination from '@/src/components/shared/common/pagination'
import { Button } from '@/src/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import { adminDeleteUser, adminGetAllUsers } from '../../api/admin/users/[id]/route'
import { User } from '@/src/lib/db/models/userModel'
import { formatId } from '@/src/lib/utils/utils'


export const metadata: Metadata = {
  title: 'Admin Users',
}

export default async function AdminUser(props: {
  searchParams: Promise<{ page: string }>
}) {
  const searchParams = await props.searchParams
  const session = await auth()
  if (session?.user.role !== 'Admin')
    throw new Error('Admin permission required')
  const page = Number(searchParams.page) || 1
  const users = await adminGetAllUsers({
    page,
  })
  return (
    <div className='space-y-2'>
       <div className="flex gap-2">
        <Link href="/admin">Dashboard</Link>
        <span>›</span>
        <span>Users</span>
      </div>
      <h1 className="h1-bold pt-4">Users</h1>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.data.map((user: User) => (
              <TableRow key={user._id}>
                <TableCell>{formatId(user._id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/users/${user._id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={user._id} action={adminDeleteUser} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users?.totalPages > 1 && (
          <Pagination page={page} totalPages={users?.totalPages} />
        )}
      </div>
    </div>
  )
}