'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '../../db/dbConnect'
import WebPageModel, { WebPage } from '../../db/models/webpageModel'
import { formatError } from '../../utils/utils'
import { WebPageInputSchema, WebPageUpdateSchema } from '../../validation/validator'
import z from 'zod'
import { cache } from 'react'
import { getSetting } from './setting'


// CREATE
export async function createWebPage(data: z.infer<typeof WebPageInputSchema>) {
  try {
    const webPage = WebPageInputSchema.parse(data)
    await connectToDatabase()
    await WebPageModel.create(webPage)
    revalidatePath('/admin/web-pages')
    return {
      success: true,
      message: 'WebPage created successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// UPDATE
export async function updateWebPage(data: z.infer<typeof WebPageUpdateSchema>) {
  try {
    const webPage = WebPageUpdateSchema.parse(data)
    await connectToDatabase()
    await WebPageModel.findByIdAndUpdate(webPage._id, webPage)
    revalidatePath('/admin/web-pages')
    return {
      success: true,
      message: 'WebPage updated successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// DELETE
export async function deleteWebPage(id: string) {
  try {
    await connectToDatabase()
    const res = await WebPageModel.findByIdAndDelete(id)
    if (!res) throw new Error('WebPage not found')
    revalidatePath('/admin/web-pages')
    return {
      success: true,
      message: 'WebPage deleted successfully',
    }
  } catch (error) {
    return { success: false, message: formatError(error) }
  }
}

// GET ALL

export const getAllWebPages = cache(async ({
  limit,
  page,
}: {
  limit?: number
  page: number
}) => {
  const {
    common: { pageSize },
  } = await getSetting()
  limit = limit || pageSize
  await connectToDatabase()

  const skipAmount = (Number(page) - 1) * limit

  // Fetch orders sorted by latest first
  const webPages = await WebPageModel.find()
    .sort({ createdAt: 'desc' })
    .skip(skipAmount)
    .limit(limit)

  const pagesCount = await WebPageModel.countDocuments()

  return {
    data: JSON.parse(JSON.stringify(webPages)) as WebPage[],
    totalPages: Math.ceil(pagesCount / limit),
  }
})

export async function getWebPageById(webPageId: string) {
  await connectToDatabase()
  const webPage = await WebPageModel.findById(webPageId)
  return JSON.parse(JSON.stringify(webPage)) as WebPage
}

// GET ONE PAGE BY SLUG
export async function getWebPageBySlug(slug: string) {
  await connectToDatabase()
  const webPage = await WebPageModel.findOne({ slug, isPublished: true })
  if (!webPage) throw new Error('WebPage not found')
  return JSON.parse(JSON.stringify(webPage)) as WebPage
}