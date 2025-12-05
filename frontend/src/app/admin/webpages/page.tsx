import Link from 'next/link'
import { Metadata } from 'next'
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
import { deleteWebPage, getAllWebPages } from '@/src/lib/services/webpageService'
import { WebPage } from '@/src/lib/db/models/webpageModel'

export const metadata: Metadata = {
  title: 'Admin Web Pages',
}

export default async function WebPageAdminPage() {
  const webPages = await getAllWebPages()
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
            {webPages.map((webPage: WebPage) => (
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
      </div>
    </div>
  )
}