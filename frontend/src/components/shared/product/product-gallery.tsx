'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0)

  // ✅ IMPORTANT: reset when variant images change
  useEffect(() => {
    setSelectedImage(0)
  }, [images])

  return (
    <div className="flex gap-2">
      {/* Thumbnails */}
      <div className="flex flex-col gap-2 mt-8">
        {images.map((image, index) => (
          <button
            key={image} // better than index
            onClick={() => setSelectedImage(index)}
            onMouseOver={() => setSelectedImage(index)}
            className={`bg-white rounded-lg overflow-hidden transition ${
              selectedImage === index
                ? 'ring-2 ring-blue-500'
                : 'ring-1 ring-gray-300'
            }`}
          >
            <Image
              src={image}
              alt="product thumbnail"
              width={40}
              height={40}
              className="object-contain"
            />
          </button>
        ))}
      </div>

      {/* Main Image */}
      <div className="w-full">
        <Zoom>
          <div className="relative h-[400px]">
            <Image
              key={images[selectedImage]} // 🔥 forces correct zoom refresh
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
