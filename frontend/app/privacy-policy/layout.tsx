import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Privacy Policy',
  'Review how Mokshya Foods handles your personal information, order data, and communication preferences.',
  '/privacy-policy'
);

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
