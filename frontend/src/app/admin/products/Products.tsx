"use client";

import { Product } from "@/src/lib/db/models/productModel";
import { formatId, truncateProductName } from "@/src/lib/utils/utils";

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import Pagination from "@/src/components/shared/common/pagination";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Expected API response:
// { data: IProduct[], totalPages: number }
interface ProductsResponse {
  data: Product[];
  totalPages: number;
}

export default function AdminProductsPage() {
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    "/api/admin/products",
    fetcher,
    { dedupingInterval: 5000 }
  );

  // DELETE PRODUCT
  const { trigger: deleteProduct } = useSWRMutation(
    "/api/admin/products",
    async (url, { arg }: { arg: { productId: string } }) => {
      const toastId = toast.loading("Deleting product...");
      const res = await fetch(`${url}/${arg.productId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      const body = await res.json();

      if (res.ok) {
        toast.success("Product deleted", { id: toastId });
        mutate(); // Refresh product list after deletion
      } else {
        toast.error(body.message || "Delete failed", { id: toastId });
      }
    }
  );

  // CREATE PRODUCT
  const { trigger: createProduct, isMutating: isCreating } = useSWRMutation(
    "/api/admin/products",
    async (url) => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) return toast.error(data.message);

      toast.success("Product created");
      mutate(); // Refresh product list to include the new product
      router.push(`/admin/products/${data.product._id}`);
    }
  );

  if (error) return <div className="text-red-500">Failed to load products.</div>;
  if (isLoading || !data) return <div>Loading products...</div>;

  const products = data.data ?? [];
  const totalPages = data.totalPages ?? 1;

  return (
    <div>
      <div className="flex gap-2">
        <Link href="/admin">Dashboard</Link>
        <span>›</span>
        <span>Products</span>
      </div>

      <h1 className="h1-bold pt-4">Products</h1>

      <div className="flex justify-end py-2">
        <button
          disabled={isCreating}
          onClick={() => createProduct()}
          className="btn btn-primary btn-sm"
        >
          {isCreating && <span className="loading loading-spinner"></span>}
          Create Product
        </button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No products found.
                </TableCell>
              </TableRow>
            )}

            {products.map((product: Product) => (
              <TableRow key={product._id}>
                <TableCell>{formatId(product._id)}</TableCell>
                <TableCell>{truncateProductName(product.name, 4)}</TableCell>
                <TableCell>${product.price}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{product.countInStock}</TableCell>
                <TableCell>{product.avgRating}</TableCell>

                <TableCell className="flex gap-2">
                  <Link
                    href={`/admin/products/${product._id}`}
                    className="px-2 text-primary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => deleteProduct({ productId: product._id })}
                    className="px-2 text-red-500"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="py-4">
          <Pagination page={1} totalPages={totalPages} />
        </div>
      )}
    </div>
  );
}
