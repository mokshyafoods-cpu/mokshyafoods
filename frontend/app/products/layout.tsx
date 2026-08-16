import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Dried Fruits & Food Powders in Nepal',
  'Explore dried mango, dried pineapple, dried orange, and beetroot powder from Mokshya Foods in Nepal.',
  '/products'
);

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}