"use client";

import useSWR from "swr";
import Link from "next/link";

import Pagination from "@/src/components/shared/common/pagination";
import { formatDateTime } from "@/src/lib/utils/utils";
import { OrderList } from "@/src/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Type for API response
interface OrdersResponse {
  data: OrderList[];
  totalPages: number;
}

export default function AdminOrdersPage() {
  const { data, error, isLoading } = useSWR<OrdersResponse>(
    "/api/admin/orders",
    fetcher,
    {
      dedupingInterval: 5000,
    }
  );

  if (error) return <div className="text-red-500">Failed to load orders.</div>;
  if (isLoading) return <div>Loading orders...</div>;

  const orders = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div>
      <div className="flex gap-2">
        <Link href="/admin">Dashboard</Link>
        <span>›</span>
        <span>Orders</span>
      </div>

      <h1 className="h1-bold pt-4">Orders</h1>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No orders found.
                </TableCell>
              </TableRow>
            )}

            {orders.map((order: OrderList) => (
              <TableRow key={order._id}>
                <TableCell>..{order._id.substring(20, 24)}</TableCell>
                <TableCell>{order.user?.name ?? "Deleted user"}</TableCell>
                <TableCell>{formatDateTime(new Date(order.createdAt)).dateTime}</TableCell>
                <TableCell>${order.totalPrice}</TableCell>
                <TableCell>
                  {order.isPaid && order.paidAt
                    ? formatDateTime(new Date(order.paidAt)).dateTime
                    : "No"}
                </TableCell>
                <TableCell>
                  {order.isDelivered && order.deliveredAt
                    ? formatDateTime(new Date(order.deliveredAt)).dateTime
                    : "No"}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className="px-2 text-primary"
                  >
                    Details
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination page={1} totalPages={totalPages} />
      )}
    </div>
  );
}
