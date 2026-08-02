import type { Metadata } from 'next';
import HomeClient from './HomeClient';
import { buildMetadata, getSocialImageUrl, getSiteUrl } from '@/lib/seo';

export const metadata: Metadata = buildMetadata({
  title: {
    default: 'Mokshya Foods | Naturally dried fruits & food powders in Nepal',
    template: '%s | Mokshya Foods',
  },
  description: 'Shop naturally dried fruits, snacks, and food powders from Mokshya Foods in Nepal. Freshly prepared products for everyday cooking, snacking, and gifting.',
  keywords: [
    'Mokshya Foods',
    'dried fruits Nepal',
    'food powders Nepal',
    'natural snacks Nepal',
  ],
  alternates: {
    canonical: getSiteUrl(),
    languages: {
      en: getSiteUrl(),
      'en-US': getSiteUrl(),
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: getSiteUrl(),
    siteName: 'Mokshya Foods',
    title: 'Mokshya Foods',
    description: 'Shop naturally dried fruits, snacks, and food powders from Mokshya Foods in Nepal. Freshly prepared products for everyday cooking, snacking, and gifting.',
    images: [{
      url: getSocialImageUrl('/1.jpeg'),
      width: 1200,
      height: 630,
      alt: 'Mokshya Foods homepage',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mokshya Foods',
    description: 'Shop naturally dried fruits, snacks, and food powders from Mokshya Foods in Nepal. Freshly prepared products for everyday cooking, snacking, and gifting.',
    images: [getSocialImageUrl('/1.jpeg')],
  },
});

export default function HomePage() {
  return <HomeClient />;
}
