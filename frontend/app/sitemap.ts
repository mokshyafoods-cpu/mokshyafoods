import type { MetadataRoute } from 'next';
import { productAPI } from '@/services/api';
import { getProductSlug } from '@/lib/productRoutes';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.mokshyafoods.com.np';

const staticRoutes = [
  '',
  '/about',
  '/about-us',
  '/blog',
  '/contact',
  '/faq',
  '/privacy',
  '/privacy-policy',
  '/products',
  '/refund',
  '/refund-policy',
  '/terms',
  '/terms-and-conditions',
];

type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency: 'weekly';
  priority: number;
};

async function getProductSitemapEntries(): Promise<SitemapEntry[]> {
  try {
    const response = await productAPI.getAll({ limit: 100 });
    const products = Array.isArray(response?.data?.data) ? response.data.data : [];

    return products
      .map((product: any) => {
        const slug = getProductSlug(product, product?._id ?? '');
        if (!slug) return null;

        return {
          url: `${baseUrl}/products/${encodeURIComponent(slug)}`,
          lastModified: product?.updatedAt ? new Date(product.updatedAt) : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      })
      .filter(Boolean) as SitemapEntry[];
  } catch (error) {
    console.error('Failed to build product sitemap entries:', error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const routes = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  const productEntries = await getProductSitemapEntries();
  return [...routes, ...productEntries];
}
