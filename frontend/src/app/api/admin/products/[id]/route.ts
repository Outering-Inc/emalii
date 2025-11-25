/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/src/lib/auth"
import { getProductById } from "@/src/lib/services/productService"
import ProductModel from "@/src/lib/db/models/productModel"

/* ──────────────────────────────── */
/* GET /api/admin/products/[id]     */
/* ──────────────────────────────── */
export const GET = auth(async (...args: any) => {
  const [req, { params }] = args

  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json({ message: "unauthorized" }, { status: 401 })
  }

  try {
    const product = await getProductById(params.id) // ✅ Use helper
    return Response.json(product)
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 404 })
  }
}) as any

/* ──────────────────────────────── */
/* PUT /api/admin/products/[id]     */
/* ──────────────────────────────── */
export const PUT = auth(async (...args: any) => {
  const [req, { params }] = args

  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json({ message: "unauthorized" }, { status: 401 })
  }

  const body = await req.json()

  try {
    // ✅ Get existing product
    const product = await getProductById(params.id) 
    if (!product) {
      return Response.json({ message: "Product not found" }, { status: 404 })
    }

    // ✅ Update product using Mongoose
    const updated = await ProductModel.findByIdAndUpdate(params.id, body, { new: true })
    return Response.json(updated)
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 500 })
  }
}) as any

/* ──────────────────────────────── */
/* DELETE /api/admin/products/[id]  */
/* ──────────────────────────────── */
export const DELETE = auth(async (...args: any) => {
  const [req, { params }] = args

  if (!req.auth || req.auth.user?.role !== "Admin") {
    return Response.json({ message: "unauthorized" }, { status: 401 })
  }

  try {
    // ✅ Ensure product exists before deleting
    await getProductById(params.id) 
    await ProductModel.findByIdAndDelete(params.id)

    return Response.json({ message: "Product deleted successfully" })
  } catch (err: any) {
    return Response.json({ message: err.message }, { status: 404 })
  }
}) as any
