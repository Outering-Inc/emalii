'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

interface ProductImageZoomProps {
  src: string
  alt: string
}

export default function ProductImageZoom({
  src,
  alt,
}: ProductImageZoomProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showZoom, setShowZoom] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setPosition({ x, y })
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] overflow-hidden bg-muted"
      onMouseEnter={() => setShowZoom(true)}
      onMouseLeave={() => setShowZoom(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Base Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className="object-contain"
        sizes="(max-width: 768px) 50vw, 25vw"
        priority
      />

      {/* Zoom Lens */}
      {showZoom && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: '200%',
            backgroundPosition: `${position.x}% ${position.y}%`,
          }}
        />
      )}
    </div>
  )
}
