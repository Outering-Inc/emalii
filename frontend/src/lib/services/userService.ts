'use server'
import { cache } from 'react'
import bcrypt from 'bcryptjs'
import { auth ,signIn, signOut } from '../auth'
import { UserName, UserSignIn, UserSignUp } from '@/src/types'
import { redirect } from 'next/navigation'
import { UserSignUpSchema } from '../validation/validator'
import dbConnect from '../db/dbConnect'
import User from '../db/models/userModel'
import { formatError } from '../utils/utils'




// CREATE
const registerUser = cache(async(userSignUp: UserSignUp) => {
  try {
    const user = await UserSignUpSchema.parseAsync({
      name: userSignUp.name,
      email: userSignUp.email,
      password: userSignUp.password,
      confirmPassword: userSignUp.confirmPassword,
    })

    await dbConnect()
    await User.create({
      ...user,
      password: await bcrypt.hash(user.password, 5),
    })
    return { success: true, message: 'User created successfully' }
  } catch (error) {
    return { success: false, error: formatError(error) }
  }
})


const updateUserName = cache(async(user: UserName) => {
  try {
    await dbConnect() //connect to database
    const session = await auth() //get session by calling auth function
    const currentUser = await User.findById(session?.user?.id)
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


// SignInWithCredentials
const signInWithCredentials = cache(async(user: UserSignIn) => {
  return await signIn('credentials', { ...user, redirect: false })
})

// SignInWithGoogle
const SignInWithGoogle = cache(async () => {
  await signIn('google')
})

// SignOut
const SignOut = cache(async () => {
  const redirectTo = await signOut({ redirect: false })
  redirect(redirectTo.redirect)
})

const userService = {
  registerUser,
  updateUserName,
  signInWithCredentials,
  SignInWithGoogle,
  SignOut
}
export default userService