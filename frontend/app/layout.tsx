import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import { Toaster } from '@/components/ui/sonner'

const geistSans = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mokshya Foods - Premium Organic Dried Fruits',
  description: 'High-quality organic dried fruits from Nepal. Premium taste, natural goodness.',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

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
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            expand={false}
            offset={16}
          />
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
