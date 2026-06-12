import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getServerDb } from '@/lib/firebase-server';

import { SITE_URL } from '@/lib/site-url';

const CATEGORIES = [
  'india', 'gcc', 'business', 'technology', 'sports',
  'entertainment', 'health', 'education', 'jobs',
  'real-estate', 'world', 'lifestyle', 'opinion',
];

export default async function sitemap() {
  const staticPages = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/videos`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categoryPages = CATEGORIES.map(cat => ({
    url: `${SITE_URL}/${cat}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.9,
  }));

  let articlePages = [];
  try {
    const db = getServerDb();
    const q = query(
      collection(db, 'articles'),
      orderBy('publishedAt', 'desc'),
      limit(1000),
    );
    const snapshot = await getDocs(q);
    articlePages = snapshot.docs
      .map(doc => {
        const data = doc.data();
        if (!data.slug) return null;
        const lastModified = data.updatedAt?.toDate?.() || data.publishedAt?.toDate?.() || new Date();
        return {
          url: `${SITE_URL}/article/${data.slug}`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.8,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error('[sitemap] Failed to fetch articles:', err.message);
  }

  return [...staticPages, ...categoryPages, ...articlePages];
}
