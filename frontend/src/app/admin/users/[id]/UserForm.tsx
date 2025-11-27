/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import Link from "next/link";

// Toast
import { toast } from "@/src/hooks/client/use-toast";

// Types & Validation
import {
  UserEditFormType,
  UserUpdateDefaultValues,
  UserUpdateInput,
} from "@/src/types";
import { UserUpdateSchema } from "@/src/lib/validation/validator";

// Cloudinary upload (single image)
import CloudinaryUploadHandler from "@/src/app/api/admin/cloudinary/CloudinaryUploadHandler";



const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserForm({ userId }: { userId: string }) {
  const router = useRouter();

  // Fetch user
  const { data: user, error } = useSWR(`/api/admin/users/${userId}`, fetcher);

  const [previewImage, setPreviewImage] = useState<string>("");

  const form = useForm<UserEditFormType>({
    resolver: zodResolver(UserUpdateSchema),
    defaultValues: UserUpdateDefaultValues,
  });

  const { control, reset, setValue, handleSubmit } = form;

  // Populate form with fetched data
  useEffect(() => {
    if (!user) return;

    reset({
      ...UserUpdateDefaultValues,
      ...user,
      role: user.role.toLowerCase(), // ensure lowercase
    });

    setPreviewImage(user.image || "");
  }, [user, reset]);

  // Cloudinary upload callback
  const handleUpload = (url: string) => {
    setPreviewImage(url);
    setValue("image", url);
  };

  // Update mutation
  const { trigger: updateUser, isMutating: isUpdating } = useSWRMutation(
    `/api/admin/users/${userId}`,
    async (_, { arg }: { arg: UserUpdateInput }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    }
  );

  // Submit
  const onSubmit: SubmitHandler<UserUpdateInput> = async (values) => {
    try {
      await updateUser(values);
      toast({ description: "User updated successfully!" });
      router.push("/admin/users");
    } catch (err: any) {
      toast({
        description: err?.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  if (error)
    return (
      <Card>
        <CardContent>Error loading user...</CardContent>
      </Card>
    );

  if (!user)
    return (
      <Card>
        <CardContent>Loading...</CardContent>
      </Card>
    );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl mb-4">Edit User</h1>

      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <FormField
            control={control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="user@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password (optional)</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Role */}
          <FormField
            control={control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Role</FormLabel>
                <FormControl>
                  <select className="border rounded-md p-2 w-full" {...field}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Profile Image */}
          <div className="space-y-2">
            <FormLabel>Profile Image</FormLabel>

            {previewImage && (
              <Image
                alt="Preview"
                src={previewImage}
                className="w-24 h-24 rounded-full border object-cover mb-2"
              />
            )}

            <CloudinaryUploadHandler onUploaded={handleUpload} />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update User"}
            </Button>

            <Link href="/admin/users">
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
