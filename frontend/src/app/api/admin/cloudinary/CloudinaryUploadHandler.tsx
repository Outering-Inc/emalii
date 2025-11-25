/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

export default function CloudinaryUploadHandler({
  previewImages,
  setPreviewImages,
  setValue,
}: {
  previewImages: string[];
  setPreviewImages: (urls: string[]) => void;
  setValue: any;
}) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const uploadedUrls: string[] = [...previewImages];

    for (const file of Array.from(files)) {
      // FIXED — CALL WITH POST
      const sigRes = await fetch("/api/admin/cloudinary/cloudinary-sign", {
        method: "POST",
      });

      if (!sigRes.ok) {
        console.error("Signature route failed");
        setUploading(false);
        return;
      }

      const { signature, timestamp } = await sigRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      formData.append("folder", "products");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploaded = await uploadRes.json();

      if (!uploaded.secure_url) {
        console.error("Cloudinary upload failed:", uploaded);
        continue;
      }

      uploadedUrls.push(uploaded.secure_url);
    }

    setPreviewImages(uploadedUrls);
    setValue("images", uploadedUrls);

    setUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        className="file-input file-input-bordered w-full max-w-md"
      />

      {uploading && (
        <p className="text-primary my-2">Uploading images… please wait.</p>
      )}
    </div>
  );
}
