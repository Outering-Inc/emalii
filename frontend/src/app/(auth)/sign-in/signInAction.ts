// app/auth/sign-in/signInActions.ts
'use server'

import { redirect } from 'next/navigation'
import { UserSignIn } from '@/src/types'
import { signInWithCredentials } from '@/src/lib/actions/userActions'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

export async function signInAction(data: UserSignIn, callbackUrl: string) {
  try {
    await signInWithCredentials({
      email: data.email,
      password: data.password,
    })

    redirect(callbackUrl)
  } catch (error) {
    if (isRedirectError(error)) throw error

    return {
      error: 'Invalid email or password',
    }
  }
}
