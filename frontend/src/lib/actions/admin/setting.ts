'use server'

import { cookies } from 'next/headers'
import { SettingInput } from '@/src/types'
import data from '../../data'
import { connectToDatabase } from '../../db/dbConnect'
import SettingModel from '../../db/models/settingModel'
import { formatError } from '../../utils/utils'

const globalForSettings = global as unknown as {
  cachedSettings: SettingInput | null
}
export const getNoCachedSetting = async (): Promise<SettingInput> => {
  await connectToDatabase()
  const setting = await SettingModel.findOne()
  return JSON.parse(JSON.stringify(setting)) as SettingInput
}

export const getSetting = async (): Promise<SettingInput> => {
  if (!globalForSettings.cachedSettings) {
    console.log('hit db')
    await connectToDatabase()
    const setting = await SettingModel.findOne().lean()
    globalForSettings.cachedSettings = setting
      ? JSON.parse(JSON.stringify(setting))
      : data.settings[0]
  }
  return globalForSettings.cachedSettings as SettingInput
}

export const updateSetting = async (newSetting: SettingInput) => {
  try {
    await connectToDatabase()
    const updatedSetting = await SettingModel.findOneAndUpdate({}, newSetting, {
      upsert: true,
      new: true,
    }).lean()
    globalForSettings.cachedSettings = JSON.parse(
      JSON.stringify(updatedSetting)
    ) // Update the cache
    return {
      success: true,
      message: 'Setting updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// Server action to update the currency cookie
export const setCurrencyOnServer = async (newCurrency: string) => {
  'use server'
  const cookiesStore = await cookies()
  cookiesStore.set('currency', newCurrency)

  return {
    success: true,
    message: 'Currency updated successfully',
  }
}