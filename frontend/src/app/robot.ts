import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.baseUrl;
    return {
        rules: [
            {
            userAgent: "*",
            allow: "/",
            disallow: ["/admin/", "/api/" ],
        },
        {
            userAgent: "Googlebot",
            allow: "/",
            disallow: ["/admin/", "/api/" ],
        },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}