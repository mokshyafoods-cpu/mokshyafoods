import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Frequently Asked Questions',
  'Find answers about ordering, shipping, product quality, delivery, and support for Mokshya Foods.',
  '/faq'
);

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
