import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mokshyafoods.com';

const staticRoutes = [
  '',
  '/about',
  '/about-us',
  '/blog',
  '/contact',
  '/faq',
  '/privacy-policy',
  '/products',
  '/terms-and-conditions',
  '/wishlist',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    ...staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    })),
  ];
}
