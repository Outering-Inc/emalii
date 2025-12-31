import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL!;
  const now = new Date();

  return [
    {
      url: `${baseUrl}/sitemap/static.xml`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/sitemap/products.xml`,
      lastModified: now,
    },
    {
      url: `${baseUrl}/sitemap/categories.xml`,
      lastModified: now,
    },
  ];
}
