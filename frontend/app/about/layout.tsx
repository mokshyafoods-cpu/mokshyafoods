import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'About Mokshya Foods',
  'Learn about Mokshya Foods, our Nepali sourcing story, and our commitment to premium organic dried fruits.',
  '/about'
);

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
