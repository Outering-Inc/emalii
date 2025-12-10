"use server"

import { connectToDatabase } from "@/src/lib/db/dbConnect"
import UserModel, { User } from "@/src/lib/db/models/userModel"
import { formatError } from "@/src/lib/utils/utils"
import { UserUpdateSchema } from "@/src/lib/validation/validator"
import { revalidatePath } from "next/cache"
import z from "zod"
import { getSetting } from "./setting"

// ADMIN GET USER BY ID
export async function adminGetUserById(userId: string) {
  await connectToDatabase()
  const user = await UserModel.findById(userId)
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user)) as User
}

// ADMIN UPDATE USER
export async function adminUpdateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    await connectToDatabase()
    const dbUser = await UserModel.findById(user._id)
    if (!dbUser) throw new Error('User not found')
    dbUser.name = user.name
    dbUser.email = user.email
    dbUser.role = user.role
    const updatedUser = await dbUser.save()
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// ADMIN DELETE USER
export async function adminDeleteUser(id: string) {
  try {
    await connectToDatabase()
    const res = await UserModel.findByIdAndDelete(id)
    if (!res) throw new Error('Use not found')
    revalidatePath('/admin/users')
    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

//ADMIN GET ALL USERS
export async function adminGetAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit
  const users = await UserModel.find()
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)
  const usersCount = await UserModel.countDocuments()
  return {
    data: JSON.parse(JSON.stringify(users)) as User[],
    totalPages: Math.ceil(usersCount / limit),
  }
}




