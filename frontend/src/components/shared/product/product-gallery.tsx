'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0)

  // ✅ Reset image when variant changes
  useEffect(() => {
    setSelectedImage(0)
  }, [images])

  if (!images.length) {
    return (
      <div className="relative h-[400px] bg-muted">
        <Image
          src="/images/placeholder.png"
          alt="placeholder"
          fill
          className="object-contain"
        />
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnails */}
      <div className="flex flex-col gap-2 mt-6">
        {images.map((image, index) => (
          <button
            key={image}
            onMouseEnter={() => setSelectedImage(index)}
            onClick={() => setSelectedImage(index)}
            className={`rounded-lg overflow-hidden border transition ${
              selectedImage === index
                ? 'ring-2 ring-primary'
                : 'ring-1 ring-muted'
            }`}
          >
            <Image
              src={image}
              alt="thumbnail"
              width={48}
              height={48}
              className="object-contain"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="flex-1">
        <Zoom>
          <div className="relative h-[420px]">
            <Image
              key={images[selectedImage]}
              src={images[selectedImage]}
              alt="product image"
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>
        </Zoom>
      </div>
    </div>
  )
}
