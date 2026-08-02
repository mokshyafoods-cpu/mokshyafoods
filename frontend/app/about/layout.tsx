import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'About Mokshya Foods',
  'Learn about Mokshya Foods, our Nepal-based food business, product range, and customer service approach.',
  '/about'
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
