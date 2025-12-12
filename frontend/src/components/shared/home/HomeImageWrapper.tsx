'use client'

import React, { ReactNode } from 'react'

interface HomeImageWrapperProps {
  imageUrl: string
  children: ReactNode
  height?: string
}

export function HomeImageWrapper({
  imageUrl,
  children,
  height = '35vh',
}: HomeImageWrapperProps) {
  return (
    <div
      className={`relative w-full ${height} bg-cover bg-center`}
      style={{ backgroundImage: `url('${imageUrl}')` }}
    >
        {/* <div className="absolute inset-0 bg-black/20"></div> */}

      <div className="relative w-full h-full">
        {children}
      </div>
    </div>
  )
}
