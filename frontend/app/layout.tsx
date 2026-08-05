import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { buildMetadata, buildSeoJsonLd } from '@/lib/seo'

const geistSans = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = buildMetadata({
  title: {
    default:
      'Mokshya Foods | Dried Fruits, Food Powders & Healthy Foods in Nepal',
    template: '%s | Mokshya Foods',
  },

  description:
    'Mokshya Foods is a Nepal-based food brand offering naturally dried fruits, dried foods, and food powders made for healthy snacking, cooking, gifting, and everyday use.',

  keywords: [
    'Mokshya Foods',
    'dried fruits Nepal',
    'dried food Nepal',
    'dried fruits in Nepal',
    'natural dried fruits',
    'dried mango Nepal',
    'dried orange Nepal',
    'dried fruit snacks Nepal',
    'healthy snacks Nepal',
    'healthy food Nepal',
    'food powders Nepal',
    'natural food products Nepal',
    'dried food products',
    'fruit powder Nepal',
    'dehydrated fruits Nepal',
    'dehydrated food Nepal',
    'Nepali food products',
  ],

  authors: [
    {
      name: 'Mokshya Foods',
      url: 'https://mokshyafoods.com.np',
    },
  ],

  creator: 'Mokshya Foods',
  publisher: 'Mokshya Foods',

  metadataBase: new URL('https://mokshyafoods.com.np'),

  alternates: {
    canonical: '/',
  },

  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },

  openGraph: {
    type: 'website',
    locale: 'en_NP',
    url: 'https://mokshyafoods.com.np',
    siteName: 'Mokshya Foods',
    title:
      'Mokshya Foods | Dried Fruits, Food Powders & Healthy Foods in Nepal',
    description:
      'Discover naturally dried fruits, dried foods, and food powders from Mokshya Foods in Nepal. Quality food products for healthy snacking, cooking, gifting, and everyday use.',
    images: [
      {
        url: '/1.jpeg',
        width: 1200,
        height: 630,
        alt: 'Mokshya Foods - Dried Fruits and Food Products in Nepal',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title:
      'Mokshya Foods | Dried Fruits, Food Powders & Healthy Foods in Nepal',
    description:
      'Naturally dried fruits, dried foods, and food powders from Mokshya Foods, Nepal.',
    images: ['/1.jpeg'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },

  category: 'Food & Beverage',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f0e8' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light bg-background">
      <body className={`${geistSans.className} antialiased bg-background text-foreground`}>
        <AuthProvider>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(buildSeoJsonLd()) }}
          />
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            expand={false}
            offset={16}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
