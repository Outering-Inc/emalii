//import AdminLayout from '@/components/admin/AdminLayout'
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import UserForm from './UserForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Edit User ${params.id}`,
  }
}

export default function UserEditPage({ params }: { params: { id: string } }) {
  return (
    <AdminLayout activeItem="users">
      <UserForm userId={params.id} />
    </AdminLayout>
  )
}