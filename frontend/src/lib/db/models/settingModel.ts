import { SettingInput } from '@/src/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface Setting extends Document, SettingInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const settingSchema = new Schema<Setting>(
  {
    common: {
      pageSize: { type: Number, required: true, default: 9 },
      isMaintenanceMode: { type: Boolean, required: true, default: false },
      freeShippingMinPrice: { type: Number, required: true, default: 0 },
      defaultTheme: { type: String, required: true, default: 'light' },
      defaultColor: { type: String, required: true, default: 'gold' },
    },
    site: {
      name: { type: String, required: true },
      url: { type: String, required: true },
      logo: { type: String, required: true },
      slogan: { type: String, required: true },
      description: { type: String, required: true },
      keywords: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      author: { type: String, required: true },
      copyright: { type: String, required: true },
      address: { type: String, required: true },
    },
    carousels: [
      {
        title: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
          unique: true,
        },
        image: {
          type: String,
          required: true,
        },
        buttonCaption: {
          type: String,
          required: true,
        },
      },
    ],
    availableLanguages: [
      {
        name: {
          type: String,
          required: true,
          set: (value: string) => Buffer.from(value).toString('utf8'),
        },
        code: { type: String, required: true },
      },
    ],
    defaultLanguage: { type: String, required: true },
    availableCurrencies: [
      {
        name: {
          type: String,
          required: true,
          set: (value: string) => Buffer.from(value).toString('utf8'),
        },
        code: { type: String, required: true },
        convertRate: { type: Number, required: true },
        symbol: {
          type: String,
          required: true,
          set: (value: string) => Buffer.from(value).toString('utf8'),
        },
      },
    ],
    defaultCurrency: { type: String, required: true },
    availablePaymentMethods: [
      {
        name: { type: String, required: true },
        commission: { type: Number, required: true, default: 0 },
      },
    ],
    defaultPaymentMethod: { type: String, required: true },
    availableDeliveryDates: [
      {
        name: { type: String, required: true },
        daysToDeliver: { type: Number, required: true },
        shippingPrice: { type: Number, required: true },
        freeShippingMinPrice: { type: Number, required: true },
      },
    ],
    defaultDeliveryDate: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

const SettingModel =
  (models.Setting as Model<Setting>) ||
  model<Setting>('Setting', settingSchema)

export default SettingModel