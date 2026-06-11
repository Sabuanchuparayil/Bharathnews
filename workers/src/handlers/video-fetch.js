import { YOUTUBE_CHANNELS } from '../lib/feeds.js';

export async function handleVideoFetch(env) {
  const results = [];

  for (const channel of YOUTUBE_CHANNELS) {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== 'ok') continue;

      for (const item of data.items.slice(0, 3)) {
        const videoId = item.link.split('v=')[1] || item.guid?.split(':').pop();
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/videos`;

        await fetch(firestoreUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.FIREBASE_TOKEN}`,
          },
          body: JSON.stringify({
            fields: {
              title: { stringValue: item.title },
              videoId: { stringValue: videoId },
              channelName: { stringValue: channel.name },
              channelId: { stringValue: channel.channelId },
              thumbnail: { stringValue: item.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
              publishedAt: { timestampValue: new Date(item.pubDate).toISOString() },
              fetchedAt: { timestampValue: new Date().toISOString() },
              category: { stringValue: channel.category },
              embedUrl: { stringValue: `https://www.youtube.com/embed/${videoId}` },
              views: { integerValue: '0' },
            },
          }),
        });

        results.push(item.title);
      }
    } catch (error) {
      console.error(`Error fetching videos for ${channel.name}:`, error.message);
    }
  }

  return results;
}
