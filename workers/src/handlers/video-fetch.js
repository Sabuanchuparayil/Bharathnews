import { loadEnabledSources, updateSourceHealth, loadSiteSettings } from '../lib/sources-loader.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { getFirebaseToken } from '../lib/firebase-auth.js';
import { FIRESTORE_BASE } from '../lib/firestore-rest.js';
import { rotateSourcePick } from '../lib/regional-rotation.js';

/** Channels per run — 6 × (1 fetch + 3 stores + 1 health) ≈ 30 subrequests. */
const MAX_CHANNELS_PER_RUN = 6;
const ITEMS_PER_CHANNEL = 3;

function safeISODate(value) {
  const d = value ? new Date(value) : new Date();
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function handleVideoFetch(env) {
  const settings = await loadSiteSettings(env);
  if (settings.pipeline?.videoFetchEnabled === false) {
    console.log('Video fetch skipped: disabled in site settings');
    return [];
  }

  const token = await getFirebaseToken(env);
  const allChannels = await loadEnabledSources(env, 'youtube');
  const channels = rotateSourcePick(allChannels, MAX_CHANNELS_PER_RUN);
  const results = [];

  for (const channel of channels) {
    try {
      const feedUrl = channel.url || `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
      const items = await fetchAndParseFeed(feedUrl);
      let stored = 0;

      for (const item of items.slice(0, ITEMS_PER_CHANNEL)) {
        const videoId = extractVideoId(item.link);
        if (!videoId) continue;

        const ok = await storeVideo(env, {
          title: item.title,
          videoId,
          channelName: channel.name,
          channelId: channel.channelId || '',
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          publishedAt: item.pubDate || new Date().toISOString(),
          category: channel.category || 'india',
          language: channel.language || 'en',
        }, token);

        if (ok) { stored++; results.push(item.title); }
      }

      await updateSourceHealth(env, channel.id, { itemCount: stored, lastError: '' }, token);
    } catch (error) {
      console.error(`Error fetching videos for ${channel.name}:`, error.message);
      await updateSourceHealth(env, channel.id, { itemCount: 0, lastError: error.message.slice(0, 200) }, token);
    }
  }

  console.log(`Video fetch complete: ${results.length} new videos`);
  return results;
}

function extractVideoId(link) {
  if (!link) return null;
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/embed\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /yt:video:([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = link.match(re);
    if (m) return m[1];
  }
  return null;
}

async function storeVideo(env, video, token) {
  const docUrl = `${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/videos/${video.videoId}?currentDocument.exists=false`;

  const res = await fetch(docUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: video.title },
        videoId: { stringValue: video.videoId },
        channelName: { stringValue: video.channelName },
        channelId: { stringValue: video.channelId },
        thumbnail: { stringValue: video.thumbnail },
        publishedAt: { timestampValue: safeISODate(video.publishedAt) },
        fetchedAt: { timestampValue: new Date().toISOString() },
        category: { stringValue: video.category },
        language: { stringValue: video.language || 'en' },
        embedUrl: { stringValue: `https://www.youtube.com/embed/${video.videoId}` },
        views: { integerValue: '0' },
      },
    }),
  });

  if (res.status === 409) return false;
  if (!res.ok) {
    const err = await res.text();
    console.error(`Video store failed "${video.title.slice(0, 40)}":`, err.slice(0, 150));
    return false;
  }
  return true;
}
