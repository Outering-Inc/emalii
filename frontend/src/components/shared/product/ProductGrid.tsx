import Pagination from '@/src/components/shared/common/pagination'
import ProductCard from '@/src/components/shared/product/product-card'
import { Product } from '@/src/lib/db/models/productModel'

interface ProductGridProps {
  products: Product[]
  page: string
  totalPages: number
  emptyMessage?: string
}

export default function ProductGrid({
  products,
  page,
  totalPages,
  emptyMessage = 'No product found',
}: ProductGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {products.length === 0 && <div>{emptyMessage}</div>}

        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} />
      )}
    </>
  )
}
