import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.elevenshop.fr';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/confirmation/', '/panier'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

