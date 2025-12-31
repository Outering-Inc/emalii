/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectToDatabase } from "@/src/lib/db/dbConnect";
import ProductModel from "@/src/lib/db/models/productModel";

export async function GET() {
  await connectToDatabase();

  const baseUrl = process.env.SITE_URL!;

  const products = await ProductModel.find(
    { status: "active" },
    { slug: 1, updatedAt: 1 }
  ).lean();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products
  .map(
    (p: any) => `
  <url>
    <loc>${baseUrl}/product/${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
