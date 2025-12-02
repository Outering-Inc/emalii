
import AdminLayout from '@/src/components/shared/admin/adminLayout'
import ProductList from './productList'

export const metadata = {
  title: 'Admin Products',
}
const AdminProductsPage = () => {
  return (
    <AdminLayout >
      <ProductList />
    </AdminLayout>
  )
}

export default AdminProductsPage