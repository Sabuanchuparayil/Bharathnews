import './globals.css';
import Providers from './providers';
import Script from 'next/script';
import { Inter, Amaranth, JetBrains_Mono } from 'next/font/google';

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

export const dynamic = 'force-dynamic';

export const viewport = {
  themeColor: '#4338ca',
  viewportFit: 'cover',
};

export const metadata = {
  title: 'The Bharath News',
  description: 'AI-Powered News for India and GCC. Breaking news, business, technology, and community stories in English and Malayalam.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thebharathnews.com'),
  manifest: '/manifest.json',
  openGraph: {
    title: 'The Bharath News',
    description: 'AI-Powered News for India and GCC regions',
    type: 'website',
    url: 'https://thebharathnews.com',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${amaranth.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
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
