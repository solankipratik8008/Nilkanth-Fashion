import { MetadataRoute } from 'next';

const BASE_URL = 'https://nilkanthfashion.ca';

const categories = [
  'girls-traditional',
  'girls-western',
  'women-traditional',
  'women-western',
  'bridal-wear',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/collections`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/custom-design`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE_URL}/collections/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages];
}
