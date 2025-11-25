
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import Products from './Products'

export const metadata = {
  title: 'Admin Products',
}
const AdminProductsPage = () => {
  return (
    <AdminLayout activeItem="products">
      <Products />
    </AdminLayout>
  )
}

export default AdminProductsPage