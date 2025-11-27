/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from '@/src/lib/auth'
import dbConnect from '@/src/lib/db/dbConnect'
import UserModel from '@/src/lib/db/models/userModel'

// GET /api/admin/users/[id]
export const GET = auth(async (...args: any) => {
  const [req, { params }] = args
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json(
      { message: 'unauthorized' },
      {
        status: 401,
      }
    )
  }
  await dbConnect()
  const user = await UserModel.findById(params.id)
  console.log('Fetched user:', user);
  if (!user) {
    return Response.json(
      { message: 'user not found' },
      {
        status: 404,
      }
    )
  }
  return Response.json(user)
}) as any

// PUT /api/admin/users/[id]
export const PUT = auth(async (...p: any) => {
  const [req, { params }] = p
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json(
      { message: 'unauthorized' },
      {
        status: 401,
      }
    )
  }

  const { name, email, role, image, password } = await req.json();

  try {
    await dbConnect()
    const user = await UserModel.findById(params.id)
    if (user) {
      user.name = name;
      user.email = email;
      user.image = image;
      user.role = role;
     
      if (password && password.trim().length > 0) {
      user.password = password; // if hashed in middleware, keep it
    }



      const updatedUser = await user.save()
      return Response.json({
        message: 'User updated successfully',
        user: updatedUser,
      })
    } else {
      return Response.json(
        { message: 'User not found' },
        {
          status: 404,
        }
      )
    }
  } catch (err: any) {
    return Response.json(
      { message: err.message },
      {
        status: 500,
      }
    )
  }
}) as any

// DELETE /api/admin/users/[id]
export const DELETE = auth(async (...args: any) => {
  const [req, { params }] = args
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json(
      { message: 'unauthorized' },
      {
        status: 401,
      }
    )
  }

  try {
    await dbConnect()
    const user = await UserModel.findById(params.id)
    if (user) {
      if (user.role === "admin")
        return Response.json(
          { message: 'User is admin' },
          {
            status: 400,
          }
        )
      await user.deleteOne()
      return Response.json({ message: 'User deleted successfully' })
    } else {
      return Response.json(
        { message: 'User not found' },
        {
          status: 404,
        }
      )
    }
  } catch (err: any) {
    return Response.json(
      { message: err.message },
      {
        status: 500,
      }
    )
  }
}) as any