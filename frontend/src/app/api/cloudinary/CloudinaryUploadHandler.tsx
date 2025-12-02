/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";

interface CloudinaryUploadHandlerProps {
  previewImages?: string[]; // optional if using onUploaded
  setPreviewImages?: (urls: string[]) => void;
  setValue?: any;
  multiple?: boolean; // true = multiple upload, false = single
  onUploaded?: (url: string) => void; // callback for single upload
}

export default function CloudinaryUploadHandler({
  previewImages = [],
  setPreviewImages,
  setValue,
  multiple = true,
  onUploaded,
}: CloudinaryUploadHandlerProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);

    // Start with existing previewImages if multiple, otherwise empty array
    const uploadedUrls: string[] = multiple ? [...previewImages] : [];

    for (const file of Array.from(files)) {
      // Get signature from backend
      const sigRes = await fetch("/api/cloudinary/cloudinary-sign", {
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

      if (multiple) {
        uploadedUrls.push(uploaded.secure_url); // multiple upload
      } else {
        uploadedUrls[0] = uploaded.secure_url; // single upload
        if (onUploaded) onUploaded(uploaded.secure_url); // trigger callback for single upload
      }
    }

    // Update state if setPreviewImages is provided
    if (setPreviewImages) setPreviewImages(uploadedUrls);
    if (setValue) setValue("images", uploadedUrls);

    setUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleUpload}
        className="file-input file-input-bordered w-full max-w-md"
      />

      {uploading && (
        <p className="text-primary my-2">Uploading image… please wait.</p>
      )}
    </div>
  );
}
