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
    default: 'Mokshya Foods | Naturally Dried Fruits & Food Powders in Nepal',
    template: '%s | Mokshya Foods',
  },
  description: 'Mokshya Foods offers naturally dried food products and food powders from Nepal for everyday use, gifting, and household routines.',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
  },
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
