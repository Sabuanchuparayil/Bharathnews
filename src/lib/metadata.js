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
  const url = languageUrl(path || '/').toString();
  const ogImage = image ? getAccessibleImageUrl(image) : DEFAULT_OG_IMAGE;
  const meta = {
    title: title || SITE_NAME,
    description: description || 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
    alternates: {
      canonical: url,
      languages: siteLanguageAlternates(path),
    },
    openGraph: {
      title: title || SITE_NAME,
      description: description || 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
      url,
      siteName: SITE_NAME,
      type,
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title || SITE_NAME }],
    },
    twitter: {
      card: 'summary_large_image',
      title: title || SITE_NAME,
      description: description || 'Breaking news from India and the Gulf for Malayali NRIs, in English and Malayalam.',
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

function hasStoredTranslation(translations, code) {
  const tr = translations?.[code];
  return Boolean(tr && typeof tr === 'object' && (tr.title || tr.summary || tr.fullContent));
}

function languageUrl(pathname, lang) {
  const url = new URL(pathname || '/', SITE_URL);
  if (lang) url.searchParams.set('lang', lang);
  return url;
}

export function siteLanguageAlternates(path = '') {
  const suffix = path.startsWith('/') ? path : path ? `/${path}` : '/';
  const url = languageUrl(suffix);
  const languages = {
    'en-IN': url,
    'x-default': url,
  };
  // Next drops ?query on the site root when resolving metadata alternates.
  if (suffix !== '/') languages['ml-IN'] = languageUrl(suffix, 'ml');
  return languages;
}

export function articleLanguageAlternates(slug, language = 'en', translations = null) {
  const pathname = `/article/${slug}`;
  const url = languageUrl(pathname);
  const source = LANG_MAP[language] ? language : 'en';
  const englishUrl = source === 'en' || hasStoredTranslation(translations, 'en')
    ? (source === 'en' ? url : languageUrl(pathname, 'en'))
    : url;
  const malayalamUrl = source === 'ml'
    ? url
    : hasStoredTranslation(translations, 'ml')
      ? languageUrl(pathname, 'ml')
      : null;

  const languages = {
    'en-IN': englishUrl,
    'x-default': englishUrl,
  };
  if (malayalamUrl) languages['ml-IN'] = malayalamUrl;

  return {
    canonical: url,
    languages,
  };
}

export function articleOgImageUrl({ title, category, language, imageUrl }) {
  if (imageUrl && !isStoredPlaceholderImage(imageUrl)) return getAccessibleImageUrl(imageUrl);
  const params = new URLSearchParams({
    title: String(title || 'The Bharath News').slice(0, 140),
    cat: String(category || 'News').slice(0, 40),
    lang: language === 'ml' ? 'ml' : 'en',
  });
  return `${SITE_URL}/api/og?${params.toString()}`;
}

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
  const authorName = (article.author || '').trim();
  const isDeskAuthor = !authorName || /bharath news|news ai|\bai\b/i.test(authorName);
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.summary,
    image: article.imageUrl ? [getAccessibleImageUrl(article.imageUrl)] : [`${SITE_URL}/og-default.png`],
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: isDeskAuthor
      ? {
        '@type': 'Organization',
        name: article.source || 'The Bharath News',
        url: SITE_URL,
      }
      : {
        '@type': 'Person',
        name: authorName,
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
