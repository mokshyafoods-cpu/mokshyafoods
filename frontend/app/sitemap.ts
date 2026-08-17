import type { MetadataRoute } from 'next';
import { productAPI, blogAPI } from '@/services/api';
import { getProductUrl } from '@/lib/productRoutes';
import { getSiteUrl } from '@/lib/seo';

const skipRemoteDataFetch = Boolean(process.env.NEXT_PUBLIC_API_URL?.includes('localhost'));
const baseUrl = getSiteUrl();

const staticRoutes = [
  '',
  '/about',
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
  if (skipRemoteDataFetch) return [];

  try {
    const response = await productAPI.getAll({ limit: 100 });
    const products = Array.isArray(response?.data?.data) ? response.data.data : [];

    return products
      .map((product: any) => {
        const url = `${baseUrl}${getProductUrl(product, product?._id ?? '')}`;
        if (!url) return null;

        return {
          url,
          lastModified: product?.updatedAt ? new Date(product.updatedAt) : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.9,
        };
      })
      .filter(Boolean) as SitemapEntry[];
  } catch (error) {
    console.warn('Sitemap product fetch failed. Falling back to static routes.', error);
    return [];
  }
}

async function getBlogSitemapEntries(): Promise<SitemapEntry[]> {
  if (skipRemoteDataFetch) return [];

  try {
    const response = await blogAPI.getAll();
    const posts = Array.isArray(response?.data?.data) ? response.data.data : [];

    return posts
      .map((post: any) => {
        if (!post?.slug) return null;
        return {
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: post?.updatedAt ? new Date(post.updatedAt) : undefined,
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      })
      .filter(Boolean) as SitemapEntry[];
  } catch (error) {
    console.warn('Sitemap blog fetch failed. Falling back to static routes.', error);
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
  const blogEntries = await getBlogSitemapEntries();
  return [...routes, ...productEntries, ...blogEntries];
}
