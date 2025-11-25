/* eslint-disable @typescript-eslint/no-explicit-any */

import { auth } from "@/src/lib/auth";
import dbConnect from "@/src/lib/db/dbConnect";
import ProductModel from "@/src/lib/db/models/productModel";

// GET /api/admin/products
export const GET = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await dbConnect();

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = 10;

  const totalProducts = await ProductModel.countDocuments();
  const totalPages = Math.ceil(totalProducts / pageSize);

  const products = await ProductModel.find()
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  return new Response(
    JSON.stringify({ data: products, totalPages }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}) as any;

// POST /api/admin/products
export const POST = auth(async (req: any) => {
  if (!req.auth || req.auth.user?.role !== "Admin") {
    return new Response(JSON.stringify({ message: "unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  await dbConnect();

  const product = new ProductModel({
    name: "sample name",
    slug: "sample-name-" + Math.random(),
    image: "/images/shirt1.jpg",
    price: 0,
    listPrice: 0,
    category: "sample category",
    brand: "sample brand",
    countInStock: 0,
    description: "sample description",
    avgRating: 0,
    numReviews: 0,
  });

  try {
    await product.save();
    return new Response(
      JSON.stringify({ product }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}) as any;
