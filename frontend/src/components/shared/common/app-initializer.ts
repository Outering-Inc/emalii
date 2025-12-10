import React, { useEffect, useState } from 'react'
import useSettingStore from '@/src/hooks/stores/use-setting-store'
import { ClientSetting } from '@/src/types'

export default function AppInitializer({
  setting,
  children,
}: {
  setting: ClientSetting
  children: React.ReactNode
}) {
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    setRendered(true)
  }, [setting])
  if (!rendered) {
    useSettingStore.setState({
      setting,
    })
  }

  return children
}