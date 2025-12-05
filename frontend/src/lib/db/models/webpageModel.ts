import { WebPageInput } from '@/src/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface WebPage extends Document, WebPageInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const webPageSchema = new Schema<WebPage>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

const WebPageModel =
  (models.WebPage as Model<WebPage>) ||
  model<WebPage>('WebPage', webPageSchema)

export default WebPageModel