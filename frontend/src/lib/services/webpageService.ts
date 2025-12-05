'use server'

import { revalidatePath } from 'next/cache'

import { connectToDatabase } from '../db/dbConnect'
import WebPageModel, { WebPage } from '../db/models/webpageModel'
import { formatError } from '../utils/utils'


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