import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { WebVitals } from '@/components/web-vitals';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://anti-detect.com'),
  title: {
    default: 'Anti-detect.com - Browser Fingerprint Scanner',
    template: '%s | Anti-detect.com',
  },
  description:
    'Test your browser fingerprint across 7 detection layers with 80+ data points. Find out if websites can track you and get recommendations to improve your privacy.',
  keywords: [
    'browser fingerprint test',
    'fingerprint scanner',
    'webrtc leak test',
    'canvas fingerprint',
    'anti-detect browser',
    'bot detection test',
  ],
  authors: [{ name: 'Anti-detect.com' }],
  creator: 'Anti-detect.com',
  publisher: 'Anti-detect.com',
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://anti-detect.com',
    siteName: 'Anti-detect.com',
    title: 'Anti-detect.com - Browser Fingerprint Scanner',
    description:
      'Test your browser fingerprint across 7 detection layers. Find out if websites can identify you.',
    images: [
      {
        url: '/og/scanner.png',
        width: 1200,
        height: 630,
        alt: 'Anti-detect.com Browser Fingerprint Scanner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Anti-detect.com - Browser Fingerprint Scanner',
    description:
      'Test your browser fingerprint across 7 detection layers. Find out if websites can identify you.',
    images: ['/twitter/scanner.png'],
    creator: '@antidetect',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/favicon.ico' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#09090b' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-bg-primary text-text-primary antialiased">
        <Providers>
          <WebVitals />
          <div className="flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
