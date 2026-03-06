import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/user/', '/auth/', '/api/'],
      },
    ],
    sitemap: 'https://nilkanthfashion.ca/sitemap.xml',
  };
}
