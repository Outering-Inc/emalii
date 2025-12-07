import { Metadata } from 'next'
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import WebPageForm from '../webpageForm'

export const metadata: Metadata = {
  title: 'Create WebPage',
}

export default function CreateWebPagePage() {
  return (
    <>
    <AdminLayout>
      <h1 className='h1-bold'>Create WebPage</h1>

      <div className='my-8'>
        <WebPageForm type='Create' />
      </div>
     </AdminLayout>
    </>
  )
}