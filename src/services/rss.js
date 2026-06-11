import { RSS_FEEDS } from '../config/feeds.config';
import logger from '../utils/logger';

/**
 * SECURITY NOTE: RSS feeds are routed through rss2json.com, a free third-party service.
 * Risks:
 * - Third-party can see all requested RSS feed URLs
 * - Service downtime = RSS features unavailable
 * - Rate limits may apply on free tier
 *
 * RECOMMENDED: Migrate to self-hosted RSS proxy via Cloudflare Worker
 * to eliminate third-party dependency. The worker URL is available at
 * import.meta.env.VITE_WORKER_URL.
 */

export async function fetchFeedItems(feedUrl, maxItems = 5) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status !== 'ok') return [];

  return data.items.slice(0, maxItems).map(item => ({
    title: item.title,
    description: (item.description || '').replace(/<[^>]*>?/gm, '').replace(/&[^;]+;/g, ' ').slice(0, 500).trim() || '',
    link: item.link,
    pubDate: item.pubDate,
    thumbnail: item.thumbnail || item.enclosure?.link || '',
    author: item.author || '',
  }));
}

export async function fetchAllFeeds(maxPerFeed = 3) {
  const results = [];

  for (const feed of RSS_FEEDS) {
    try {
      const items = await fetchFeedItems(feed.url, maxPerFeed);
      items.forEach(item => {
        results.push({
          ...item,
          source: feed.name,
          category: feed.category,
          region: feed.region,
        });
      });
    } catch (error) {
      logger.error(`Error fetching ${feed.name}:`, error);
    }
  }

  return results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}
