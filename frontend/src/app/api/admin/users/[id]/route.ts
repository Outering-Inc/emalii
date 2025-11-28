"use server"
import { PAGE_SIZE } from "@/src/lib/constants"
import dbConnect from "@/src/lib/db/dbConnect"
import UserModel, { User } from "@/src/lib/db/models/userModel"
import { formatError } from "@/src/lib/utils/utils"
import { UserUpdateSchema } from "@/src/lib/validation/validator"
import { revalidatePath } from "next/cache"
import z from "zod"

// GET USER BY ID
export async function getUserById(userId: string) {
  await dbConnect()
  const user = await UserModel.findById(userId)
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user)) as User
}

// UPDATE USER
export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
  try {
    await dbConnect()
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

// DELETE USER
export async function deleteUser(id: string) {
  try {
    await dbConnect()
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

// GET ALL USERS
export async function getAllUsers({
  limit,
  page,
}: {
  limit?: number
  page: number
}) {
  limit = limit || PAGE_SIZE
  await dbConnect()

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



