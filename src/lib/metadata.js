import { SITE_URL } from '@/lib/site-url';
import { isStoredPlaceholderImage } from '@/utils/articleImages';
const SITE_NAME = 'The Bharath News';

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

function getAccessibleImageUrl(imageUrl) {
  if (!imageUrl || isStoredPlaceholderImage(imageUrl)) return DEFAULT_OG_IMAGE;
  if (imageUrl.startsWith(SITE_URL)) return imageUrl;
  if (imageUrl.startsWith('/')) return `${SITE_URL}${imageUrl}`;
  // Direct HTTPS URL for social crawlers (Facebook/Telegram) — avoids Next.js proxy cache collisions
  if (imageUrl.startsWith('https://')) return imageUrl;
  if (imageUrl.startsWith('http://')) return imageUrl.replace(/^http:\/\//, 'https://');
  return DEFAULT_OG_IMAGE;
}

export function siteMetadata({ title, description, path = '', image, type = 'website', keywords, publishedTime, modifiedTime }) {
  const url = `${SITE_URL}${path}`;
  const ogImage = image ? getAccessibleImageUrl(image) : DEFAULT_OG_IMAGE;
  const meta = {
    title: title || SITE_NAME,
    description: description || 'Breaking news from India and GCC. Business, technology, cricket, Bollywood & community stories for Indians worldwide.',
    alternates: { canonical: url },
    openGraph: {
      title: title || SITE_NAME,
      description: description || 'Breaking news from India and GCC regions — multilingual coverage in 8 Indian languages',
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title || SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title || SITE_NAME,
      description: description || 'Breaking news from India & GCC — politics, cricket, business, Bollywood in 8 languages',
      images: [ogImage],
    },
  };
  if (keywords?.length) meta.keywords = keywords;
  if (type === 'article') {
    if (publishedTime) meta.openGraph.publishedTime = publishedTime;
    if (modifiedTime) meta.openGraph.modifiedTime = modifiedTime;
    meta.openGraph.authors = ['The Bharath News'];
    if (keywords?.length) {
      meta.other = { news_keywords: keywords.join(', ') };
    }
  }
  return meta;
}

const LANG_MAP = { en: 'en', hi: 'hi', ml: 'ml', ta: 'ta', kn: 'kn', te: 'te', bn: 'bn', ur: 'ur' };

const LANG_REGION_MAP = {
  en: 'India, GCC, UAE, Global',
  hi: 'India, North India, Hindi Belt',
  ml: 'Kerala, Gulf Malayali, UAE, Saudi Arabia',
  ta: 'Tamil Nadu, Sri Lanka, Singapore',
  te: 'Andhra Pradesh, Telangana',
  kn: 'Karnataka, Bengaluru',
  bn: 'West Bengal, Bangladesh',
  ur: 'India, Pakistan',
};

export function articleJsonLd(article) {
  const publishDate = article.publishedAt?.seconds
    ? new Date(article.publishedAt.seconds * 1000).toISOString()
    : new Date().toISOString();
  const modifiedDate = article.updatedAt?.seconds
    ? new Date(article.updatedAt.seconds * 1000).toISOString()
    : publishDate;
  const lang = LANG_MAP[article.language] || 'en';
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [article.imageUrl] : [],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Organization',
      name: article.source || 'The Bharath News',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'The Bharath News',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-512x512.png`, width: 512, height: 512 },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/article/${article.slug}` },
    articleSection: article.category || 'News',
    inLanguage: lang,
    isAccessibleForFree: true,
    keywords: article.tags?.join(', ') || undefined,
    contentLocation: {
      '@type': 'Place',
      name: LANG_REGION_MAP[article.language] || 'India',
    },
    about: {
      '@type': 'Thing',
      name: article.category || 'News',
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url ? `${SITE_URL}${item.url}` : undefined,
    })),
  };
}

export function safeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
