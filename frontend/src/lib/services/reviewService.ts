'use server'

import { cache } from 'react'
import mongoose from 'mongoose'
import { revalidatePath } from 'next/cache'

import { auth } from '../auth'
import dbConnect from '../db/dbConnect'


import { ReviewInputSchema } from '../validation/validator'

import Product from '../db/models/productModel'

//import Review, { Review } from '../db/models/reviewModel'
import { ReviewDetails, ReviewInput } from '@/src/types'
import { formatError } from '../utils/utils'
import { PAGE_SIZE } from '../constants'
import ReviewModel from '../db/models/reviewModel'


// CREATE
export const createUpdateReview = cache(async({
  data,
  path,
}: {
  data: ReviewInput
  path: string
}) => {
  try {

    const session = await auth
    ()
    if (!session) {
      throw new Error('User not authenticated')
    }
    const review = ReviewInputSchema.parse({
      ...data,
      user: session?.user?.id,
    })
   await dbConnect()
    const existReview = await ReviewModel.findOne({
      product: review.product,
      user: review.user,
     })

    if (existReview) {
      existReview.comment = review.comment
      existReview.rating = review.rating
      existReview.title = review.title
      await existReview.save()
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
         success: true, 
         message: 'Review updated successfully'
         }
    } else {
      await ReviewModel.create(review)
      await updateProductReview(review.product)
      revalidatePath(path)
      return {
        success: true, 
        message: 'Review created successfully'
      }
    }
  } catch (error) {
    return { 
      success: false, 
      message: formatError(error)
     }
  }
 })

 export const updateProductReview = cache(async (productId: string) => {
  //Calculate the new average rating,number of reviews and rating distribution
  const result = await ReviewModel.aggregate([
    { $match: {product: new mongoose.Types.ObjectId(productId)} },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 },
      },
    },  
        
  ])
  //Calculate the total number of reviews and average rating
  const totalReviews = result.reduce((sum, { count}) => sum + count, 0) 
  const averageRating = result.reduce((sum, { _id, count }) => sum + _id * count, 0) / totalReviews

  //Calcaulate aggregation result  to a map for easier lookup
  const ratingMap = result.reduce((map, { _id, count }) => {
    map[_id] = count
    return map
  },{})
  //Ensure all rating 1-5 are presented with missing ones set to count 0
  const ratingDistribution = []
  for (let i = 1; i <= 5; i++) {
    ratingDistribution.push({
      rating: i,
      count: ratingMap[i] || 0,
    })
  }
  //Update the product fields with calculated values 
  await Product.findByIdAndUpdate(productId, {
    rating: averageRating,
    numReviews: totalReviews,
    ratingDistribution
  }
   
  )
   
})   
  
// GET REVIEWS BY PRODUCT ID
export const getReviews = cache(async({
  productId,
  limit,
  page,
}: {
  productId: string
  limit?: number
  page: number
}) => {
  
  limit = limit || PAGE_SIZE
  await dbConnect()
  const skipAmount = (page - 1) * limit
  const reviews = await ReviewModel.find({ product: productId })
    .populate('user', 'name')
    .sort({
      createdAt: 'desc',
    })
    .skip(skipAmount)
    .limit(limit)
  const reviewsCount = await ReviewModel.countDocuments({ product: productId })
  return {
    data: JSON.parse(JSON.stringify(reviews)) as ReviewDetails[],
    totalPages: reviewsCount === 0 ? 1 : Math.ceil(reviewsCount / limit),
  }
})


// GET REVIEW BY PRODUCT ID AND USER ID
 export const getReviewByProductId = cache(async ({
  productId,
}: {
  productId: string
}) => {
  await dbConnect()
  const session = await auth()
  if (!session) {
    throw new Error('User not authenticated')
  }
  const review = await ReviewModel.findOne({
    product: productId,
    user: session?.user?.id, //user is the current user
  })
  return review ? (JSON.parse(JSON.stringify(review)) as ReviewDetails) : null
})

