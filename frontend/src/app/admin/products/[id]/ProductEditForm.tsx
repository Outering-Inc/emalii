/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

// UI
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

// Custom
import CloudinaryUploadHandler from "@/src/app/api/admin/cloudinary/CloudinaryUploadHandler";
import ProductPreview from "@/src/components/shared/product/productPreview";

// Types
import {
  ProductEditFormType,
  ProductUpdateDefaultValues,
  ProductUpdateInput,
} from "@/src/types";

import { ProductUpdateSchema } from "@/src/lib/validation/validator";
import { toast } from "@/src/hooks/client/use-toast";


// Fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductEditForm({ productId }: { productId: string }) {
  const router = useRouter();

  // Fetch existing product
  const { data: product, error } = useSWR(
    `/api/admin/products/${productId}`,
    fetcher
  );

  // Preview images
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  // Form setup with shared defaults
  const form = useForm<ProductEditFormType>({
    resolver: zodResolver(ProductUpdateSchema),
    defaultValues: ProductUpdateDefaultValues,
  });

  const { control, reset, setValue, handleSubmit } = form;

  // Populate form once product is loaded
  useEffect(() => {
    if (!product) return;
    const payload = product.data ?? product;

    reset({
      ...ProductUpdateDefaultValues,
      ...payload,
      images: payload.images ?? [],
    });

    setPreviewImages(payload.images ?? []);
  }, [product, reset]);

  // SWR Mutation for update (Option 1 typing)
  const { trigger: updateProduct, isMutating: isUpdating } = useSWRMutation(
    `/api/admin/products/${productId}`,
    async (_, { arg }: { arg: ProductUpdateInput }) => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    }
  );

  // Submit handler
  const onSubmit: SubmitHandler<ProductUpdateInput> = async (values) => {
    const payload: ProductUpdateInput = {
           ...values,
      images: previewImages,
    };

    try {
      await updateProduct(payload);
      toast({ description: "Product updated successfully!" });
      router.push("/admin/products");
    } catch (err: any) {
      toast({
        description: err?.message || "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const removeImage = (url: string) => {
    const updated = previewImages.filter((img) => img !== url);
    setPreviewImages(updated);
    setValue("images", updated);
  };

  // UI states
  if (error)
    return (
      <Card>
        <CardContent>Error loading product...</CardContent>
      </Card>
    );

  if (!product)
    return (
      <Card>
        <CardContent>Loading...</CardContent>
      </Card>
    );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-4">Edit Product</h1>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Product name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug */}
          <FormField
            control={control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input placeholder="product-slug" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Stock */}
          <FormField
            control={control}
            name="countInStock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Count In Stock</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Images */}
          <div className="space-y-2">
            <FormLabel>Images</FormLabel>
            <CloudinaryUploadHandler
              previewImages={previewImages}
              setPreviewImages={setPreviewImages}
              setValue={setValue}
            />
            <ProductPreview
              previewImages={previewImages}
              removeImage={removeImage}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Product"}
            </Button>
            <Link href="/admin/products">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
