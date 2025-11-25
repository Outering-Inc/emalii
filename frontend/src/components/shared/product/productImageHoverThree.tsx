/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'

type Props = {
  src: string
  hoverSrc1: string
  hoverSrc2: string
  alt: string
}

const ProductImageHoverThree = ({ src, hoverSrc1, hoverSrc2, alt }: Props) => {
  const [activeImage, setActiveImage] = useState(0) // 0 = default, 1 = hover1, 2 = hover2
  const timeoutRef = useRef<any>(null)

  const handleMouseEnter = () => {
    // step 1 → after 1 sec show image 1
    timeoutRef.current = setTimeout(() => {
      setActiveImage(1)

      // step 2 → after another 1 sec show image 2
      timeoutRef.current = setTimeout(() => {
        setActiveImage(2)
      }, 1000)
    }, 1000)
  }

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current)
    setActiveImage(0) // reset back to main image
  }

  const images = [src, hoverSrc1, hoverSrc2]

  return (
    <div
      className="relative h-52 w-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((image, i) => (
        <Image
          key={i}
          src={image}
          alt={alt}
          fill
          sizes="80vw"
          className={`absolute inset-0 object-contain transition-opacity duration-500 ${
            activeImage === i ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}

export default ProductImageHoverThree
