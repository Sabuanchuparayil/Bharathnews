import './globals.css';
import Providers from './providers';
import Script from 'next/script';
import YandexMetrika from '@/components/YandexMetrika';
import { Amaranth, Manjari, JetBrains_Mono } from 'next/font/google';
import { safeJsonLd } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site-url';

const amaranth = Amaranth({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-amaranth',
  display: 'swap',
});

const manjari = Manjari({
  weight: ['400', '700'],
  subsets: ['latin', 'malayalam'],
  variable: '--font-manjari',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport = {
  themeColor: '#0D7377',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: {
    default: 'The Bharath News — India and Gulf news for Malayali NRIs',
    template: '%s | The Bharath News',
  },
  description: 'Breaking news from India and the Gulf for Malayali NRIs — Kerala, Gulf, money, sports, tech, and community stories in English and Malayalam.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.json',
  keywords: [
    // Core brand & discovery
    'The Bharath News', 'Bharath News', 'India news today', 'Indian news live',
    'breaking news India', 'latest news India', 'today news headlines',
    // GCC & Gulf
    'GCC news', 'Gulf news today', 'UAE news', 'Dubai news', 'Abu Dhabi news',
    'Saudi Arabia news', 'Qatar news', 'Bahrain news', 'Kuwait news', 'Oman news',
    'Indian expat news Gulf', 'NRI news UAE', 'NRI news Saudi', 'Indians in Gulf',
    'Middle East news today', 'Gulf Indian community',
    'Malayalam news today', 'Kerala news', 'മലയാളം വാർത്ത',
    'Gulf Malayali news', 'NRI news Malayalam', 'swarnam vila',
    // Categories
    'India politics news', 'Indian economy news', 'India business news',
    'Indian stock market', 'Sensex Nifty today', 'IPO news India',
    'cricket news', 'IPL news', 'BCCI news', 'India cricket score',
    'Bollywood news', 'Indian entertainment news', 'South Indian movies',
    'India technology news', 'Indian startups', 'IT sector India',
    'Indian sports news', 'India Olympics', 'Indian football',
    'India education news', 'UPSC news', 'JEE NEET updates',
    'India health news', 'Indian real estate', 'India jobs news',
    // AI agentic / conversational discovery
    'what is happening in India today', 'latest Indian headlines',
    'India current affairs', 'India daily news summary',
    'news for Indians in UAE', 'news for Indians in Saudi Arabia',
    'Indian diaspora news', 'India news English',
    'Malayali news Gulf', 'India news English', 'India news Malayalam',
  ],
  authors: [{ name: 'The Bharath News', url: SITE_URL }],
  creator: 'The Bharath News',
  publisher: 'The Bharath News',
  formatDetection: { telephone: false },
  alternates: {
    canonical: SITE_URL,
    types: {
      'application/rss+xml': [
        { url: `${SITE_URL}/feed.xml`, title: 'The Bharath News — All Articles' },
        { url: `${SITE_URL}/feed.xml?lang=en`, title: 'The Bharath News — English' },
        { url: `${SITE_URL}/feed.xml?lang=ml`, title: 'The Bharath News — Malayalam' },
      ],
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
    description: 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
    type: 'website',
    url: SITE_URL,
    siteName: 'The Bharath News',
    locale: 'en_IN',
    images: [{ url: `${SITE_URL}/og-default.png`, width: 1200, height: 630, alt: 'The Bharath News — Breaking News India & GCC' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Bharath News — Breaking News India & GCC',
    description: 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
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
  other: {
    'news_keywords': 'India, GCC, UAE, Kerala, Malayalam, NRI, gold rate, cricket, Gulf jobs',
    'geo.region': 'IN',
    'geo.placename': 'India',
    'ICBM': '20.5937, 78.9629',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'The Bharath News',
  alternateName: ['Bharath News', 'TheBharathNews', 'ഭാരത് ന്യൂസ്'],
  url: SITE_URL,
  description: 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
  inLanguage: ['en', 'ml'],
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
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
    {
      '@type': 'ReadAction',
      target: `${SITE_URL}/feed.xml`,
    },
  ],
  about: [
    { '@type': 'Thing', name: 'India', sameAs: 'https://www.wikidata.org/wiki/Q668' },
    { '@type': 'Thing', name: 'Gulf Cooperation Council', sameAs: 'https://www.wikidata.org/wiki/Q217172' },
    { '@type': 'Thing', name: 'Non-resident Indian', sameAs: 'https://www.wikidata.org/wiki/Q2419774' },
  ],
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'The Bharath News',
  alternateName: ['Bharath News', 'TheBharathNews'],
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  foundingDate: '2024',
  areaServed: [
    { '@type': 'Country', name: 'India' },
    { '@type': 'Country', name: 'United Arab Emirates' },
    { '@type': 'Country', name: 'Saudi Arabia' },
    { '@type': 'Country', name: 'Qatar' },
    { '@type': 'Country', name: 'Bahrain' },
    { '@type': 'Country', name: 'Kuwait' },
    { '@type': 'Country', name: 'Oman' },
  ],
  knowsLanguage: ['en', 'ml'],
  publishingPrinciples: `${SITE_URL}/editorial`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'bharathnewsweb@gmail.com',
    availableLanguage: ['English', 'Malayalam'],
  },
  sameAs: [
    'https://t.me/TheBharathNews',
    'https://www.facebook.com/TheBharathNewsIndia',
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${amaranth.variable} ${manjari.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="BharathNews" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="preconnect" href="https://www.googleapis.com" crossOrigin="anonymous" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
          </>
        )}
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
        <YandexMetrika />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
