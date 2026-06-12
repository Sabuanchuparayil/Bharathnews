import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getServerDb } from '@/lib/firebase-server';

import { SITE_URL } from '@/lib/site-url';

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  let articles = [];
  try {
    const db = getServerDb();
    const q = query(
      collection(db, 'articles'),
      orderBy('publishedAt', 'desc'),
      limit(50),
    );
    const snapshot = await getDocs(q);
    articles = snapshot.docs.map(doc => {
      const d = doc.data();
      const pubDate = d.publishedAt?.toDate?.() || new Date();
      return {
        title: d.title || '',
        link: `${SITE_URL}/article/${d.slug}`,
        description: d.summary || '',
        pubDate: pubDate.toUTCString(),
        category: d.category || 'news',
        author: d.source || 'The Bharath News',
        image: d.imageUrl || '',
      };
    });
  } catch (err) {
    console.error('[feed.xml] Failed to fetch articles:', err.message);
  }

  const items = articles.map(a => `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${a.link}</link>
      <guid isPermaLink="true">${a.link}</guid>
      <description>${escapeXml(a.description)}</description>
      <pubDate>${a.pubDate}</pubDate>
      <category>${escapeXml(a.category)}</category>
      <author>${escapeXml(a.author)}</author>${a.image ? `\n      <enclosure url="${escapeXml(a.image)}" type="image/jpeg" />` : ''}
    </item>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Bharath News</title>
    <link>${SITE_URL}</link>
    <description>Breaking news from India and GCC regions. Business, technology, sports, and community stories.</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/icons/icon-512x512.png</url>
      <title>The Bharath News</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
    },
  });
}
