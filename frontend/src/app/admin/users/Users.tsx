/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { User } from '@/src/lib/db/models/userModel'
import { formatId } from '@/src/lib/utils/utils'
import Link from 'next/link'
import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { useToast } from '@/src/hooks/client/use-toast'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'
import Pagination from '@/src/components/shared/common/pagination'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface UsersResponse {
  data: User[]
  totalPages: number
}

export default function Users() {
 
  const { toast } = useToast() // custom toast
  const page = 1 // can extend later to handle dynamic pages

  const { data, error, isLoading, mutate } = useSWR<UsersResponse>(
    `/api/admin/users?page=${page}`,
    fetcher,
    { dedupingInterval: 5000 }
  )

  // DELETE USER
  const { trigger: deleteUser } = useSWRMutation(
    '/api/admin/users',
    async (url, { arg }: { arg: { userId: string } }) => {
      const { id } = toast({ title: 'Deleting user...', open: true })
      try {
        const res = await fetch(`${url}/${arg.userId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
        const body = await res.json()

        if (res.ok) {
          toast({ id, title: 'User deleted successfully', open: true })
          mutate() // refresh list
        } else {
          toast({ id, title: body.message || 'Delete failed', open: true })
        }
      } catch (err: any) {
        toast({ id, title: err.message || 'Network error', open: true })
      }
    }
  )

  if (error) return <div className="text-red-500">Failed to load users.</div>
  if (isLoading || !data) return <div>Loading users...</div>

  const users = data.data ?? []
  const totalPages = data.totalPages ?? 1

  return (
    <div>
      <div className="flex gap-2">
        <Link href="/admin">Dashboard</Link>
        <span>›</span>
        <span>Users</span>
      </div>

      <h1 className="h1-bold pt-4">Users</h1>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {users.map((user: User) => (
              <TableRow key={user._id}>
                <TableCell>{formatId(user._id)}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role === 'admin' ? 'YES' : 'NO'}</TableCell>
                <TableCell className="flex gap-2">
                  <Link
                    href={`/admin/users/${user._id}`}
                    className="px-2 text-primary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteUser({ userId: user._id })}
                    className="px-2 text-red-500"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="py-4">
          <Pagination page={page} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
