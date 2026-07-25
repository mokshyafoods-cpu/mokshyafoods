import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Mokshya Foods Blog',
  'Read health tips, recipes, and nutrition insights curated for a naturally healthy lifestyle.',
  '/blog'
);

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
