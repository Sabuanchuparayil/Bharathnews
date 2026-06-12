import './globals.css';
import Providers from './providers';
import Script from 'next/script';
import { Inter, Amaranth, JetBrains_Mono } from 'next/font/google';
import { safeJsonLd } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site-url';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const amaranth = Amaranth({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-amaranth',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport = {
  themeColor: '#101223',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: {
    default: 'The Bharath News — Breaking News from India & GCC',
    template: '%s | The Bharath News',
  },
  description: 'Breaking news from India and GCC regions. Business, technology, sports, entertainment, and community stories in English, Hindi, Malayalam, Tamil, Kannada, Telugu, and Bengali.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  keywords: ['India news', 'GCC news', 'breaking news', 'Malayalam news', 'Tamil news', 'Telugu news', 'Kannada news', 'Bengali news', 'Hindi news', 'business news', 'technology news', 'sports news'],
  authors: [{ name: 'The Bharath News', url: SITE_URL }],
  creator: 'The Bharath News',
  publisher: 'The Bharath News',
  formatDetection: { telephone: false },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': `${SITE_URL}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'The Bharath News — Breaking News from India & GCC',
    description: 'Breaking news from India and GCC regions. Business, technology, sports, and community stories.',
    type: 'website',
    url: SITE_URL,
    siteName: 'The Bharath News',
    locale: 'en_IN',
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: 'The Bharath News' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Bharath News',
    description: 'Breaking news from India and GCC regions',
    images: [`${SITE_URL}/og-default.png`],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BharathNews',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/icons/apple-touch-icon.png' }],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  },
  category: 'news',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'The Bharath News',
  url: SITE_URL,
  description: 'Breaking news from India and GCC regions',
  publisher: {
    '@type': 'NewsMediaOrganization',
    name: 'The Bharath News',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icons/icon-512x512.png`,
      width: 512,
      height: 512,
    },
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'The Bharath News',
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  sameAs: [],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${amaranth.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="BharathNews" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://firestore.googleapis.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd([websiteJsonLd, organizationJsonLd]) }}
        />
      </head>
      <body className="min-h-screen bg-surface-1 dark:bg-dark-surface-0 text-gray-900 dark:text-gray-50 transition-colors duration-300 font-body">
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
