
export async function GET() {
  const baseUrl = process.env.SITE_URL!;
  const now = new Date().toISOString();

  const urls = [
    { loc: `${baseUrl}/`, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/page/about-us`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/page/help`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/page/customer-service`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/page/privacy-policy`, priority: "0.4", changefreq: "yearly" },
    { loc: `${baseUrl}/page/terms-and-conditions`, priority: "0.4", changefreq: "yearly" },
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
