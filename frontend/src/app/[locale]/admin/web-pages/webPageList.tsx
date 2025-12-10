import Link from 'next/link'
import { Button } from '@/src/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table'

import DeleteDialog from '@/src/components/shared/common/deleteDialog'
import { formatId } from '@/src/lib/utils/utils'
import { WebPage } from '@/src/lib/db/models/webpageModel'
import { deleteWebPage, getAllWebPages,  } from '@/src/lib/actions/admin/webPages'
import { auth } from '@/src/lib/auth'
import Pagination from '@/src/components/shared/common/pagination'


export default async function WebPageList({ page }: { page: string }) {
    const pageNumber = Number(page) || 1

    const session = await auth()
      if (session?.user.role !== 'Admin')
        throw new Error('Admin permission required')
  const webPages = await getAllWebPages({ page: pageNumber })
  return (
    <div className='space-y-2'>
      <div className='flex-between'>
        <h1 className='h1-bold'>Web Pages</h1>
        <Button asChild variant='default'>
          <Link href='/admin/web-pages/create'>Create WebPage</Link>
        </Button>
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[100px]'>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>IsPublished</TableHead>
              <TableHead className='w-[100px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webPages.data.map((webPage: WebPage) => (
              <TableRow key={webPage._id}>
                <TableCell>{formatId(webPage._id)}</TableCell>
                <TableCell>{webPage.title}</TableCell>
                <TableCell>{webPage.slug}</TableCell>
                <TableCell>{webPage.isPublished ? 'Yes' : 'No'}</TableCell>
                <TableCell className='flex gap-1'>
                  <Button asChild variant='outline' size='sm'>
                    <Link href={`/admin/web-pages/${webPage._id}`}>Edit</Link>
                  </Button>
                  <DeleteDialog id={webPage._id} action={deleteWebPage} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {webPages?.totalPages > 1 && (
            <Pagination page={page} totalPages={webPages?.totalPages} />
        )}
      </div>
    </div>
  )
}