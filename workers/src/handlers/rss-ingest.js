import { loadEnabledSources, updateSourceHealth } from '../lib/sources-loader.js';
import { resolveArticleImage } from '../lib/image-resolver.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { getFirebaseToken } from '../lib/firebase-auth.js';
import { FIRESTORE_BASE } from '../lib/firestore-rest.js';

const MAX_SOURCES_PER_RUN = 12;
const ITEMS_PER_SOURCE = 2;

export async function handleRSSIngest(env) {
  const token = await getFirebaseToken(env);
  const allSources = await loadEnabledSources(env, 'rss');
  const googleSources = await loadEnabledSources(env, 'googlenews');
  const sources = [...allSources, ...googleSources].slice(0, MAX_SOURCES_PER_RUN);
  const results = [];

  for (const feed of sources) {
    try {
      const items = await fetchAndParseFeed(feed.url);
      let stored = 0;

      for (const item of items.slice(0, ITEMS_PER_SOURCE)) {
        if (!item.title || !item.link) continue;

        const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
        const resolvedImage = await resolveArticleImage({
          imageUrl: item.imageUrl || '',
          sourceUrl: item.link,
          category: feed.category || 'india',
        });
        const ok = await storeRawArticle(env, {
          title: item.title,
          description: item.description || '',
          sourceUrl: item.link,
          source: feed.name,
          sourceId: feed.id,
          category: feed.category || 'india',
          region: feed.region || 'india',
          language: feed.language || 'en',
          publishedAt: item.pubDate || new Date().toISOString(),
          imageUrl: resolvedImage,
          slug,
        }, token);

        if (ok) { stored++; results.push(item.title); }
      }

      await updateSourceHealth(env, feed.id, { itemCount: stored, lastError: '' }, token);
    } catch (error) {
      console.error(`Error fetching ${feed.name}:`, error.message);
      await updateSourceHealth(env, feed.id, { itemCount: 0, lastError: error.message.slice(0, 200) }, token);
    }
  }

  console.log(`RSS ingest complete: ${results.length} new articles from ${sources.length} sources`);
  return results;
}

async function storeRawArticle(env, article, token) {
  const docUrl = `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/raw_articles/${article.slug}?currentDocument.exists=false`;

  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: article.title },
        description: { stringValue: article.description },
        sourceUrl: { stringValue: article.sourceUrl },
        source: { stringValue: article.source },
        sourceId: { stringValue: article.sourceId || '' },
        category: { stringValue: article.category },
        region: { stringValue: article.region },
        language: { stringValue: article.language },
        slug: { stringValue: article.slug },
        imageUrl: { stringValue: article.imageUrl },
        status: { stringValue: 'pending_ai' },
        publishedAt: { timestampValue: new Date(article.publishedAt || Date.now()).toISOString() },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    }),
  });

  if (res.status === 409) return false;
  if (!res.ok) {
    const err = await res.text();
    console.error(`Store failed for "${article.title.slice(0, 40)}":`, err.slice(0, 150));
    return false;
  }
  return true;
}
