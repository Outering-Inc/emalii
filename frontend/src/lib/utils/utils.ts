/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from "next/server"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import qs from 'query-string'
import mongoose from "mongoose"


//Defining a function to generate a URL with updated query parameters
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string
  key: string
  value: string | null
}) {
  const currentUrl = qs.parse(params)

  currentUrl[key] = value

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumberWithDecimal = (num: number): string => {
  const [int, decimal] = num.toString().split('.')
  return decimal ? `${int}.${decimal.padEnd(2, '0')}` : int
}
// PROMPT: [ChatGTP] create toSlug ts arrow function that convert text to lowercase, remove non-word,
// non-whitespace, non-hyphen characters, replace whitespace, trim leading hyphens and trim trailing hyphens

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')

    const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
      currency: 'USD',
      style: 'currency',
      minimumFractionDigits: 2,
    })
    export function formatCurrency(amount: number) {
      return CURRENCY_FORMATTER.format(amount)
    }
    
   
      

    // PROMPT: [ChatGTP] create round2 ts arrow function that round number to 2 decimal
    export const round2 = (num: number) =>
      Math.round((num + Number.EPSILON) * 100) / 100

    export function convertDocToObj(doc: any) {
      doc._id = doc._id.toString()
      return doc
    }

    export const formatNumber = (x: number) => {
      return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    
    // PROMPT: [ChatGTP] create generateId ts arrow function that generate random id for items in the shopping cart
    export const generateId = () =>
      Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join('')
    
   
export const formatError = (error: any): string => {
  if (error.name === 'ZodError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return `${error.errors[field].path}: ${errorMessage}` // field: errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.name === 'ValidationError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue)[0]
    return `${duplicateField} already exists`
  } else {
    // return 'Something went wrong. please try again'
    return typeof error.message === 'string'
      ? error.message
      : JSON.stringify(error.message)
  }
}

export function calculateFutureDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() + days)
  return currentDate
}
export function getMonthName(yearMonth: string): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1)
  const monthName = date.toLocaleString('default', { month: 'long' })
  const now = new Date()

  if (year === now.getFullYear() && month === now.getMonth() + 1) {
    return `${monthName} Ongoing`
  }
  return monthName
}

export function calculatePastDate(days: number) {
  const currentDate = new Date()
  currentDate.setDate(currentDate.getDate() - days)
  return currentDate
}
export function timeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0) // Set to 12:00 AM (next day)

  const diff = midnight.getTime() - now.getTime() // Difference in milliseconds
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { hours, minutes }
}

export const formatDateTime = (dateString: string | Date) => {
  // If the value is a string, convert to Date
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short",  // abbreviated month name (e.g., 'Oct')
    year: "numeric", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // day of the month (e.g., '5')
    hour: "numeric", // hour (e.g., '8 PM')
    minute: "numeric", // numeeric minute (e.g., '30')
    hour12: true,  // use 12-hour clock (true) or 24-hour clock (false)
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",  // abbreviated month name (e.g., 'Oct')
    year: "numeric",  // numeric year (e.g., '2023')
    day: "numeric",   // numeric day of the month (e.g., '25')
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",  // numeric hour (e.g., '8')
    minute: "numeric",  // numeric minute (e.g., '30')
    hour12: true,   // use 12-hour clock (true) or 24-hour clock (false)
  };

  return {
    dateTime: date.toLocaleString("en-US", dateTimeOptions),
    dateOnly: date.toLocaleString("en-US", dateOptions),
    timeOnly: date.toLocaleString("en-US", timeOptions),
  };
};


export function formatId(id: string) {
  return `..${id.substring(20, 24)}`
}

// PROMPT: [ChatGTP] create getFilterUrl ts arrow function that return filter url for search page
export const getFilterUrl = ({
  params,
  category,
  tag,
  sort,
  price,
  rating,
  page,
}: {
  params: {
    q?: string
    category?: string
    subcategory?: string
    tag?: string
    price?: string
    rating?: string
    sort?: string
    page?: string
  }
  tag?: string
  category?: string
  subcategory?: string
  sort?: string
  price?: string
  rating?: string
  page?: string
}) => {
  const newParams = { ...params }
  if (category) newParams.category = category
  if (tag) newParams.tag = toSlug(tag)
  if (price) newParams.price = price
  if (rating) newParams.rating = rating
  if (page) newParams.page = page
  if (sort) newParams.sort = sort
  return `/search?${new URLSearchParams(newParams).toString()}`
}

// Truncate product name to first 2-3 words
export const truncateProductName = (name: string, maxWords = 3) => {
  if (!name) return "";
  const words = name.split(" ");
  if (words.length <= maxWords) return name;
  return words.slice(0, maxWords).join(" ") + "...";
};

// src/lib/utils/slugify.ts
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')





export function getOrderIdFromRequest(req: NextRequest | URL) {
  let pathname: string

  if ('nextUrl' in req && req.nextUrl instanceof URL) {
    // TypeScript now knows nextUrl is URL
    pathname = req.nextUrl.pathname
  } else if (req instanceof URL) {
    pathname = req.pathname
  } else {
    throw new Error('Cannot extract pathname from request')
  }

  const segments = pathname.split('/').filter(Boolean) // remove empty segments
  const orderIndex = segments.indexOf('orders')
  if (orderIndex === -1 || !segments[orderIndex + 1]) {
    throw new Error('Order ID not found in path')
  }

  return segments[orderIndex + 1]
}


/**
 * Extracts the [checkoutId] dynamic segment from a NextRequest
 */
// src/lib/utils/getCheckoutId.ts

export function getCheckoutId(req: NextRequest): string | null {
  // 1️⃣ Check URL query
  const url = new URL(req.url)
  const idFromQuery = url.searchParams.get('checkoutId')
  if (idFromQuery && mongoose.Types.ObjectId.isValid(idFromQuery)) {
    return idFromQuery
  }

  // 2️⃣ Check path parameters (if using /api/payments/[checkoutId])
  const match = req.nextUrl.pathname.match(/\/api\/payments\/([a-f\d]{24})/)
  if (match && mongoose.Types.ObjectId.isValid(match[1])) {
    return match[1]
  }

  // 3️⃣ Could add header fallback if needed
  const idFromHeader = req.headers.get('x-checkout-id')
  if (idFromHeader && mongoose.Types.ObjectId.isValid(idFromHeader)) {
    return idFromHeader
  }

  return null
}


    
