/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/src/lib/auth"
import dbConnect from "@/src/lib/db/dbConnect"
import UserModel from "@/src/lib/db/models/userModel"

// GET /api/admin/users
export const GET = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json(
      { message: 'unauthorized' },
      { status: 401 }
    )
  }

  await dbConnect()

  // pagination support
  const page = Number(req.nextUrl.searchParams.get("page")) || 1
  const pageSize = 10

  const totalUsers = await UserModel.countDocuments()
  const totalPages = Math.ceil(totalUsers / pageSize)

  const users = await UserModel.find()
    .skip((page - 1) * pageSize)
    .limit(pageSize)

  return Response.json({
    data: users,
    totalPages,
  })
}) as any
