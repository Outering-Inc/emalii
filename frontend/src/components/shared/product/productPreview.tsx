"use client"

import React from "react"
import Image from "next/image"

interface Props {
  previewImages: string[]
  removeImage: (url: string) => void
}

export default function ProductPreview({ previewImages, removeImage }: Props) {
  if (!previewImages || previewImages.length === 0) return null

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {previewImages.map((url, index) => (
        <div key={index} className="relative w-24 h-24">
          <Image
            src={url}
            alt={`Preview ${index + 1}`}
            fill
            style={{ objectFit: "cover" }}
            className="rounded border"
          />
          <button
            type="button"
            onClick={() => removeImage(url)}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}
