import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Privacy Policy',
  'Review how Mokshya Foods handles your personal information, order data, and communication preferences.',
  '/privacy'
);

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
