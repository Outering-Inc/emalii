import { Metadata } from 'next'

import { redirect } from 'next/navigation'
import CheckoutForm from './checkout-form'
import { auth } from '@/src/lib/auth'

export const metadata: Metadata = {
  title: 'Checkout',
}

export default async function CheckoutPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/sign-in?callbackUrl=/checkout')
  }
  return <CheckoutForm/> 
}