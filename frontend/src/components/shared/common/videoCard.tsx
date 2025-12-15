'use client'

import Image from 'next/image'

interface IProps {
  videoUrl: string
  title: string
  buttonsOnly: boolean
}

export default function VideoCard({ videoUrl, title, buttonsOnly }: IProps) {
  if (buttonsOnly) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[101px] bg-[#333] flex justify-center items-center border rounded-[20px]">
          <div className="flex gap-2 items-center">
            <Image src="/images/ring.png" alt="ring" width={24} height={24} />
            <p className="font-semibold text-[16px] text-[#F1F1F1]">Use Cases</p>
          </div>
        </div>

        <div className="h-[101px] bg-[#333] flex justify-center items-center border rounded-[20px]">
          <div className="flex gap-2 items-center">
            <Image src="/images/star.png" alt="star" width={24} height={24} />
            <p className="font-semibold text-[16px] text-[#F1F1F1]">Features</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* VIDEO CONTAINER */}
      <div className="relative h-[214px] overflow-hidden rounded-[20px] bg-black">
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

      <p className="text-lightGray text-center mt-[15px]">
        {title}
      </p>
    </div>
  )
}
