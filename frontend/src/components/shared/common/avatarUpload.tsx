"use client"

import { Avatar, AvatarImage, AvatarFallback } from "@/src/components/ui/avatar"
import CloudinaryUploadHandler from "@/src/app/api/admin/cloudinary/CloudinaryUploadHandler"

interface AvatarUploadProps {
  value: string
  onChange: (url: string) => void
}

const AvatarUpload = ({ value, onChange }: AvatarUploadProps) => {
  const handleUpload = (url: string) => {
    onChange(url)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="w-24 h-24">
        {value ? (
          <AvatarImage src={value} alt="User" />
        ) : (
          <AvatarFallback>U</AvatarFallback>
        )}
      </Avatar>

      <CloudinaryUploadHandler onUploaded={handleUpload} />
    </div>
  )
}

export default AvatarUpload
