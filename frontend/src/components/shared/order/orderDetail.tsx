/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useSession } from "next-auth/react";

import { Badge } from "@/src/components/ui/badge";
import { buttonVariants } from "../../ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

import ProductPrice from "../product/product-price";
import { cn, formatDateTime } from "@/src/lib/utils/utils";
import { OrderList } from "@/src/types";

// SWR fetcher
const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function OrderDetailsForm({
  orderId,
 
}: {
  orderId: string;
  isAdmin: boolean 
}) {
  const { data: session } = useSession();

  // GET ORDER
  const { data: order, error, mutate } = useSWR<OrderList>(
    `/api/orders/${orderId}`,
    fetcher
  );

  // MARK AS DELIVERED (ADMIN ONLY)
  const { trigger: deliverOrder, isMutating: isDelivering } = useSWRMutation(
    `/api/orders/${orderId}`,
    async () => {
      const res = await fetch(`/api/admin/orders/${orderId}/deliver`, {
        method: "PUT",
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Order marked as delivered");
        mutate();
      } else {
        toast.error(data.message);
      }
    }
  );

  // States
  if (error) return <p className="text-red-500">Error loading order</p>;
  if (!order) return <p>Loading...</p>;

  const {
    shippingAddress,
    items,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentMethod,
    isPaid,
    paidAt,
    isDelivered,
    deliveredAt,
    expectedDeliveryDate,
  } = order;

  return (
    <div className="grid md:grid-cols-3 md:gap-5">
      {/* LEFT SIDE */}
      <div className="overflow-x-auto md:col-span-2 space-y-4">
        
        {/* SHIPPING */}
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Shipping Address</h2>
            <p>{shippingAddress.fullName} {shippingAddress.phone}</p>
            <p>
              {shippingAddress.street}, {shippingAddress.city},{" "}
              {shippingAddress.province}, {shippingAddress.postalCode},{" "}
              {shippingAddress.country}
            </p>

            {isDelivered ? (
              <Badge>Delivered at {formatDateTime(deliveredAt!).dateTime}</Badge>
            ) : (
              <div>
                <Badge variant="destructive">Not delivered</Badge>
                <div className="pt-2 text-sm">
                  Expected delivery: {formatDateTime(expectedDeliveryDate).dateTime}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PAYMENT */}
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Payment Method</h2>
            <p>{paymentMethod}</p>

            {isPaid ? (
              <Badge>Paid at {formatDateTime(paidAt!).dateTime}</Badge>
            ) : (
              <Badge variant="destructive">Not paid</Badge>
            )}
          </CardContent>
        </Card>

        {/* ORDER ITEMS */}
        <Card>
          <CardContent className="p-4 gap-4">
            <h2 className="text-xl pb-4">Order Items</h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.slug}>
                    <TableCell>
                      <Link href={`/product/${item.slug}`} className="flex items-center">
                        <Image src={item.image} alt={item.name} width={50} height={50} />
                        <span className="px-2">{item.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="text-right">${item.price}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT SIDE SUMMARY */}
      <div>
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="text-xl pb-4">Order Summary</h2>

            {[
              ["Items", itemsPrice],
              ["Tax", taxPrice],
              ["Shipping", shippingPrice],
              ["Total", totalPrice],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <div>{label}</div>
                <ProductPrice price={value as number} plain />
              </div>
            ))}

            {/* PAY BUTTON */}
            {!isPaid && ["Mpesa", "Stripe", "PayPal"].includes(paymentMethod) && (
              <Link
                className={cn(buttonVariants(), "w-full")}
                href={`/checkout/${order._id}`}
              >
                Pay Order
              </Link>
            )}

            {/* ADMIN */}
            {session?.user?.role === "Admin" && (
              <button
                onClick={() => deliverOrder()}
                disabled={isDelivering}
                className="btn w-full my-2"
              >
                {isDelivering ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Mark as delivered"
                )}
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
