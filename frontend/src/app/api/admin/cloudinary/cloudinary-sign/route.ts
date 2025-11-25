/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/src/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const POST = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json({ message: "unauthorized" }, { status: 401 });
  }

  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "products",
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return Response.json({ timestamp, signature });
}) as any;
