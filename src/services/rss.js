import { RSS_FEEDS } from '../config/feeds.config';

export async function fetchFeedItems(feedUrl, maxItems = 5) {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status !== 'ok') return [];

  return data.items.slice(0, maxItems).map(item => ({
    title: item.title,
    description: item.description?.replace(/<[^>]*>/g, '').slice(0, 500) || '',
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
      console.error(`Error fetching ${feed.name}:`, error);
    }
  }

  return results.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
}
