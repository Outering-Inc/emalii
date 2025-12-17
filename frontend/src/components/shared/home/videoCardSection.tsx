'use client'

import React from 'react'
import VideoCard from '../common/videoCard'

export default function VideoCardSection() {
  const data = [
   
    
    {
      videoUrl: '/videos/christmas-video.mp4',
      title: 'Bring brands to life with interactive hero moments',
      buttonsOnly: false,
    },
   
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
      {data.map((video, index) => (
        <VideoCard key={index} {...video} />
      ))}
    </div>
  )
}
