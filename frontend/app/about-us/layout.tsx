import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'About Mokshya Foods',
  'Learn about Mokshya Foods, our mission, product range, and customer support approach in Nepal.',
  '/about-us'
);

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
