import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Shop Products',
  'Browse Mokshya Foods dried fruits, snacks, and gift-ready packs with clear product details and local delivery in Nepal.',
  '/products'
);

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}