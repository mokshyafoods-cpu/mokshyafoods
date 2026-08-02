import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Terms & Conditions',
  'Read the terms and conditions for using Mokshya Foods website, placing orders, and interacting with our services.',
  '/terms'
);

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
