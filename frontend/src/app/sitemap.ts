import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.baseUrl
    return  [
        {url: `${baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1
        }, 
        {url: `${baseUrl}/page/about-us`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/page/customer-service`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
        },
        {url: `${baseUrl}/page/privacy-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
        },
        {url: `${baseUrl}/page/terms-and-conditions`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
        },
        {url: `${baseUrl}/page/returns-policy`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
        },
        {url: `${baseUrl}/page/help`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
        },
        {url: `${baseUrl}/page/conditions-of-use`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=todays-deal`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=new-arrival`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=best-seller`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=featured`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=category-explore`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=power-discount`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=fast-moving`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=approvals`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/search?tag=premium`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        },
        {url: `${baseUrl}/products/all`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8
        }
    ];      
}