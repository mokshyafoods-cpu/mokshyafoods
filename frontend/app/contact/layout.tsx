import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata(
  'Contact Mokshya Foods',
  'Reach the Mokshya Foods team for product questions, wholesale inquiries, and customer support in Nepal.',
  '/contact'
);

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
