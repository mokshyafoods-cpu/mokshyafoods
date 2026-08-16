import type { Metadata } from 'next';

const SITE_NAME = 'Mokshya Foods';
const DEFAULT_DESCRIPTION = 'Mokshya Foods offers naturally dried food products and food powders from Nepal for everyday use, gifting, and household routines.';

function normalizeSiteUrl(value: string) {
  return String(value || 'https://www.mokshyafoods.com.np').trim().replace(/\/+$/, '');
}

const DEFAULT_SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.mokshyafoods.com.np');
const DEFAULT_IMAGE_PATH = '/logo.jpeg';
const DEFAULT_IMAGE = `${DEFAULT_SITE_URL}${DEFAULT_IMAGE_PATH}`;

export function getSiteUrl() {
  return DEFAULT_SITE_URL;
}

export function getSocialImageUrl(path: string = DEFAULT_IMAGE_PATH) {
  if (!path) return DEFAULT_IMAGE;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${DEFAULT_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

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
      'dried fruits Nepal',
      'dried mango Nepal',
      'dried kiwi Nepal',
      'food powders Nepal',
      'beetroot powder Nepal',
      'moringa powder Nepal',
      'healthy snacks Nepal',
      'natural food products Nepal',
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
        alt: 'Mokshya Foods products',
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
      icon: '/favicon.png',
    },
    ...overrides,
  };
}

export function buildPageMetadata(title: string, description: string, path: string): Metadata {
  const url = `${DEFAULT_SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  return buildMetadata({
    title,
    description,
    keywords: [
      SITE_NAME,
      'Mokshya Foods',
      'Nepal food products',
      'dried fruits Nepal',
      `${title.toLowerCase()}`,
    ],
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
  const productName = product?.name ? String(product.name).trim() : 'Mokshya Foods Product';
  const categoryName = typeof product?.category === 'string'
    ? product.category
    : product?.category?.name || 'food product';
  const simpleCategory = String(categoryName).trim() || 'food product';
  const title = product?.name ? `${productName} in Nepal | Mokshya Foods` : 'Mokshya Foods Product';
  const description = product?.description
    ? `${productName} from Mokshya Foods is a ${simpleCategory.toLowerCase()} product for everyday use in Nepal.`
    : `Shop ${productName} from Mokshya Foods in Nepal. A ${simpleCategory.toLowerCase()} product selected for everyday use.`;
  const image = getSocialImageUrl(product?.thumbnail || product?.image || DEFAULT_IMAGE_PATH);

  return buildMetadata({
    title,
    description: description.slice(0, 160),
    keywords: [
      SITE_NAME,
      productName,
      `${productName.toLowerCase()} Nepal`,
      `${simpleCategory.toLowerCase()} Nepal`,
      'Mokshya Foods Nepal',
    ].filter(Boolean) as string[],
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
      description: description.slice(0, 160),
      images: [{
        url: image,
        width: 1200,
        height: 630,
        alt: productName,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.slice(0, 160),
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
    logo: getSocialImageUrl(),
    image: getSocialImageUrl('/1.jpeg'),
    description: DEFAULT_DESCRIPTION,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tilottama-01, Rupandehi, Banbitika, Butwal',
      addressRegion: 'Lumbini Province',
      addressCountry: 'NP',
    },
    telephone: '+9779761583987',
    email: 'mokshyafoods@gmail.com',
    sameAs: [
      'https://www.facebook.com/mokshyafoods',
      'https://www.instagram.com/mokshyafoods',
    ],
    priceRange: 'NPR',
    areaServed: 'Nepal',
    availableLanguage: ['English', 'Nepali'],
    currenciesAccepted: 'NPR',
    paymentAccepted: 'Cash on Delivery',
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: DEFAULT_SITE_URL,
    name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: getSocialImageUrl(),
      },
    },
  };
}

export function buildSeoJsonLd() {
  return [buildOrganizationJsonLd(), buildWebsiteJsonLd()];
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
  const images = [...galleryImages, primaryImage].filter(Boolean).map((img) => {
    try {
      // make image URLs absolute when they are site-relative
      if (img && img.startsWith('/')) return `${DEFAULT_SITE_URL}${img}`;
    } catch {
      // ignore
    }
    return img;
  });

  const sku = product?.sku || product?._id || product?.id || undefined;
  const priceCurrency = product?.currency || 'NPR';

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product?.name || 'Mokshya Foods Product',
    description: product?.description || 'Naturally prepared food products from Nepal, designed for everyday use and gifting.',
    image: images,
    url,
    sku,
    brand: {
      '@type': 'Brand',
      name: 'Mokshya Foods',
    },
    category: typeof product?.category === 'string' ? product.category : product?.category?.name || 'Food & Beverage',
    offers: {
      '@type': 'Offer',
      priceCurrency,
      price: isFinite(price) ? price : undefined,
      availability: Number(product?.quantity ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url,
      priceValidUntil: product?.saleEnd ? new Date(product.saleEnd).toISOString() : undefined,
    },
    ...(product?.rating || product?.reviewCount
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(product?.rating || 0),
            reviewCount: Number(product?.reviewCount || 0),
          },
        }
      : {}),
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
