import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Refund Policy',
  'Understand Mokshya Foods refund and return practices for damaged or incorrect orders in Nepal.',
  '/refund'
);

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
