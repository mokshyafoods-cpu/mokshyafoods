import type { Metadata } from 'next';

const SITE_NAME = 'Mokshya Foods';
const DEFAULT_DESCRIPTION = 'Premium organic dried fruits from Nepal with natural flavor, quality packaging, and fast delivery.';
const DEFAULT_IMAGE = '/logo.jpeg';
const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://mokshyafoods.com';

export function buildMetadata(overrides: Metadata = {}): Metadata {
  const title = overrides.title ?? {
    default: SITE_NAME,
    template: '%s | Mokshya Foods',
  };

  return {
    metadataBase: new URL(DEFAULT_SITE_URL),
    title,
    description: overrides.description ?? DEFAULT_DESCRIPTION,
    keywords: [
      'Mokshya Foods',
      'Nepalese dried fruits',
      'organic snacks',
      'dried mango',
      'dried kiwi',
      'healthy snacks Nepal',
      'premium food gifts',
    ],
    alternates: {
      canonical: DEFAULT_SITE_URL,
      languages: {
        en: DEFAULT_SITE_URL,
        'en-US': DEFAULT_SITE_URL,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: DEFAULT_SITE_URL,
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [{
        url: DEFAULT_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Mokshya Foods premium dried fruits',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [DEFAULT_IMAGE],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: '/icon.svg',
      shortcut: '/icon.svg',
      apple: '/apple-icon.png',
    },
    ...overrides,
  };
}

export function buildPageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${DEFAULT_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  return buildMetadata({
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        'en-US': url,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{
        url: DEFAULT_IMAGE,
        width: 1200,
        height: 630,
        alt: title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_IMAGE],
    },
  });
}

export function buildProductMetadata(product: any, url: string): Metadata {
  const title = product?.name ? `${product.name} | Mokshya Foods` : 'Mokshya Foods Product';
  const description = (product?.description || DEFAULT_DESCRIPTION).slice(0, 160);
  const image = product?.thumbnail || product?.image || DEFAULT_IMAGE;

  return buildMetadata({
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: url,
        'en-US': url,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: product?.name || 'Mokshya Foods product',
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  });
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${DEFAULT_SITE_URL}/#store`,
    name: SITE_NAME,
    url: DEFAULT_SITE_URL,
    logo: `${DEFAULT_SITE_URL}/logo.jpeg`,
    image: `${DEFAULT_SITE_URL}/1.jpeg`,
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Butwal',
      addressRegion: 'Lumbini',
      addressCountry: 'NP',
    },
    telephone: '+977-71-540000',
    email: 'mokshyafoods@gmail.com',
    sameAs: [
      'https://www.facebook.com/mokshyafoods',
      'https://www.instagram.com/mokshyafoods',
    ],
    priceRange: 'NPR',
    areaServed: 'Nepal',
    availableLanguage: ['English', 'Nepali'],
    currenciesAccepted: 'NPR',
    paymentAccepted: 'Cash, Bank Transfer, Digital Wallet',
  };
}

export function buildProductJsonLd(product: any, url: string) {
  const price = Number(product?.discountPrice ?? product?.price ?? 0);
  const originalPrice = Number(product?.price ?? 0);
  const galleryImages = Array.isArray(product?.images)
    ? product.images
        .map((image: any) => image?.url || image?.secure_url || image?.path || image?.src || '')
        .filter(Boolean)
    : [];
  const primaryImage = product?.thumbnail || product?.image || galleryImages[0] || '/1.jpeg';
  const images = [...galleryImages, primaryImage].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name || 'Mokshya Foods Product',
    description: product?.description || 'Premium organic dried fruits from Nepal.',
    image: images,
    url,
    sku: product?.sku || undefined,
    brand: {
      '@type': 'Brand',
      name: 'Mokshya Foods',
    },
    category: typeof product?.category === 'string' ? product.category : product?.category?.name || 'Food & Beverage',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price,
      availability: Number(product?.quantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
      priceValidUntil: product?.saleEnd ? new Date(product.saleEnd).toISOString() : undefined,
    },
    ...(originalPrice > 0 && originalPrice > price
      ? {
          additionalProperty: [{
            '@type': 'PropertyValue',
            name: 'Compare at price',
            value: `NPR ${originalPrice}`,
          }],
        }
      : {}),
  };
}
