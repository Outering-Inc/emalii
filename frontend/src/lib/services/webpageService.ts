'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '../db/dbConnect'
import WebPageModel, { WebPage } from '../db/models/webpageModel'
import { formatError } from '../utils/utils'
import { WebPageInputSchema, WebPageUpdateSchema } from '../validation/validator'
import z from 'zod'


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
export async function getAllWebPages() {
  await connectToDatabase()
  const webPages = await WebPageModel.find()
  return JSON.parse(JSON.stringify(webPages)) as WebPage[]
}
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