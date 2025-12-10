// app/admin/dashboard/page.tsx

import { Metadata } from 'next'
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import Dashboard from './Dashboard'
import { auth } from '@/src/lib/auth'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

const DashboardPage = async () => {
  // Get logged-in user
  const session = await auth()

  // Protect route
  if (!session?.user || session.user.role !== 'Admin') {
    throw new Error('Admin permission required')
  }

  // Render page inside AdminLayout
  return (
    <AdminLayout >
      <Dashboard />
    </AdminLayout>
  )
}

export default DashboardPage
