/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { truncateProductName } from "@/lib/utils";



export type Product = {
  slug: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  tags: string[];
  isPublished: boolean;
  listPrice: number;
  brand: string;
  avgRating: number;
  numReviews: number;
  ratingDistribution: { rating: number; count: number }[];
  numSales: number;
  countInStock: number;
  description: string;
  sizes: string[];
  colors: string[];
  reviews: any[];
  variantImages: Record<string, string[]>;
  variants: any[];

};

export const columns: ColumnDef<Product>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        checked={row.getIsSelected()}
      />
    ),
  },
  {
    accessorKey: "image",
    header: "Image",
       cell: ({ row }) => {
          const product = row.original;
            return (
             <div className="w-9 h-9 relative">
               <Image
                 src={product.images[0]}
                 alt={product.name} 
                 fill
                 className="rounded-full object-cover"
               />
             </div>
          );
        }
  },
  {
  accessorKey: "name",
  header: "Name",
  cell: ({ row }) => {
    const name = row.getValue("name") as string;

    return (
      <span className="font-medium">
        {truncateProductName(name, 3)}
      </span>
    );
  },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
  accessorKey: "description",
  header: "Description",
  cell: ({ row }) => {
    const product = row.original;
    return (
      <span className="text-sm text-muted-foreground">
        {truncateProductName(product.description, 5)}
      </span>
    );
  },
},
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.slug)}
            >
              Copy product ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href={`/products/${product.slug}`}>View product</Link>
            </DropdownMenuItem>
           
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
