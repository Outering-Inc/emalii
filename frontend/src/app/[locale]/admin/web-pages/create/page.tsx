import { Metadata } from 'next'
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import WebPageForm from '../webpageForm'

export const metadata: Metadata = {
  title: 'Create Web Page | Emalii Admin',
  description: 'Admin interface for creating and managing website pages.',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function CreateWebPagePage() {
  return (
    <AdminLayout>
      <h1 className="h1-bold">Create WebPage</h1>

      <div className="my-8">
        <WebPageForm type="Create" />
      </div>
    </AdminLayout>
  )
}
