export async function GET() {
  const baseUrl = process.env.SITE_URL!;
  const now = new Date().toISOString();

  // ONLY high-intent tags (limit them)
  const tags = [
    "todays-deal",
    "best-seller",
    "new-arrival",
    "featured",
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${tags
  .map(
    tag => `
  <url>
    <loc>${baseUrl}/search?tag=${tag}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
