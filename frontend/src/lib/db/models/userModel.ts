import { UserInput } from '@/src/types'
import { Document, Model, model, models, Schema } from 'mongoose'

export interface User extends Document, UserInput {
  _id: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<User>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'User' },
    password: { type: String },
    image: { type: String },
    emailVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
)

const UserModel = (models.User as Model<User>) || model<User>('User', userSchema)

export default UserModel