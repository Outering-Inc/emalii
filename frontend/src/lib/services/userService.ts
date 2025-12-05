'use server'
import { cache } from 'react'
import bcrypt from 'bcryptjs'
import { auth ,signIn, signOut } from '../auth'
import { UserName, UserSignIn, UserSignUp } from '@/src/types'
import { redirect } from 'next/navigation'
import { UserSignUpSchema, UserUpdateSchema } from '../validation/validator'
import { connectToDatabase } from '../db/dbConnect'
import UserModel, { User } from '../db/models/userModel'
import { formatError } from '../utils/utils'
import { revalidatePath } from 'next/cache'
import z from 'zod'




// CREATE
export const registerUser = cache(async(userSignUp: UserSignUp) => {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await connectToDatabase()
    await UserModel.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })
    return { success: true, message: 'User created successfully' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
})


// SignInWithCredentials
export const signInWithCredentials = cache(async(user: UserSignIn) => {
  return await signIn('credentials', { ...user, redirect: false })
})

// SignInWithGoogle
export const SignInWithGoogle = cache(async () => {
  await signIn('google')
})

// SignOut
export const SignOut = cache(async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
})


export const updateUserName = cache(async(user: UserName) => {
  try {
    await connectToDatabase() //connect to database
    const session = await auth() //get session by calling auth function
    const currentUser = await UserModel.findById(session?.user?.id)
    if (!currentUser) throw new Error('User not found')
    currentUser.name = user.name
    const updatedUser = await currentUser.save()
    return {
      success: true,
      message: 'User updated successfully',
      data: JSON.parse(JSON.stringify(updatedUser)),
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
})

// GET USER BY ID
export async function getUserById(userId: string) {
  await connectToDatabase()
  const user = await UserModel.findById(userId)
  if (!user) throw new Error('User not found')
  return JSON.parse(JSON.stringify(user)) as User
}

// UPDATE USER
export async function updateUser(user: z.infer<typeof UserUpdateSchema>) {
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

// DELETE USER
export async function deleteUser(id: string) {
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

