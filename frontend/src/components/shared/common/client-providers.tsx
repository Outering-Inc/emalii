'use client'

import React from 'react'
import useCartSidebar from '@/src/hooks/client/use-cart-sidebar'
import CartSidebar from '../cart/cart-sidebar'
import { ThemeProvider } from '../theme/theme-provider'
import { Toaster } from '@/src/components/ui/toaster'
import AppInitializer from './app-initializer'
import { ClientSetting } from '@/src/types'

export default function ClientProviders({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const visible = useCartSidebar()

  return (
    <AppInitializer setting={setting}>
      <ThemeProvider
        attribute='class'
        defaultTheme={setting.common.defaultTheme.toLocaleLowerCase()}
      >
        {visible ? (
          <div className='flex min-h-screen'>
            <div className='flex-1 overflow-hidden'>{children}</div>
            <CartSidebar />
          </div>
        ) : (
          <div>{children}</div>
        )}
        <Toaster />
      </ThemeProvider>
    </AppInitializer>
  )
}