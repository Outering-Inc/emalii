import AdminLayout from '@/src/components/shared/admin/adminLayout'

import ProductEditForm from './ProductEditForm'

export function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Edit Product ${params.id}`,
  }
}

export default function ProductEditPage({
  params,
}: {
  params: { id: string }
}) {
  return (
    <AdminLayout activeItem="products">
      <ProductEditForm productId={params.id} />
    </AdminLayout>
  )
}