import { loadEnabledSources, updateSourceHealth, loadSiteSettings } from '../lib/sources-loader.js';
import { fetchAndParseFeed } from '../lib/rss-parser.js';
import { upsertRow } from '../lib/supabase-rest.js';
import { rotateSourcePick } from '../lib/regional-rotation.js';
import { getLimits } from '../lib/cf-limits.js';

export async function handleVideoFetch(env, options = {}) {
  const L = getLimits(env);
  const maxChannels = options.maxChannels ?? L.VIDEO_CHANNELS_PER_RUN ?? 3;
  const itemsPerChannel = options.itemsPerChannel ?? L.VIDEO_ITEMS_PER_CHANNEL ?? 5;
  const settings = await loadSiteSettings(env);
  if (settings.pipeline?.videoFetchEnabled === false) {
    console.log('Video fetch skipped: disabled in site settings');
    return [];
  }

  const allChannels = await loadEnabledSources(env, 'youtube');
  if (!allChannels.length) {
    console.log('Video fetch skipped: no enabled YouTube sources');
    return [];
  }

  const channels = rotateSourcePick(allChannels, maxChannels);
  const results = [];

  for (const channel of channels) {
    try {
      const channelId = resolveChannelId(channel);
      const feedUrl = channel.url || `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      if (!feedUrl) continue;

      const items = await fetchAndParseFeed(feedUrl);
      let stored = 0;

      for (const item of items.slice(0, itemsPerChannel)) {
        const videoId = extractVideoId(item.link);
        if (!videoId) continue;

        const ok = await storeVideo(env, {
          title: item.title,
          videoId,
          channelName: channel.name,
          channelId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          category: channel.category || 'india',
          language: channel.language || 'en',
          publishedAt: parsePubDate(item.pubDate),
        });

        if (ok) { stored++; results.push(item.title); }
      }

      await updateSourceHealth(env, channel.id, { itemCount: stored, lastError: '' });
    } catch (error) {
      console.error(`Error fetching videos for ${channel.name}:`, error.message);
      await updateSourceHealth(env, channel.id, { itemCount: 0, lastError: error.message.slice(0, 200) });
    }
  }

  console.log(`Video fetch complete: ${results.length} new videos`);
  return results;
}

function resolveChannelId(channel) {
  if (channel.channelId) return channel.channelId;
  const fromUrl = extractChannelIdFromUrl(channel.url);
  if (fromUrl) return fromUrl;
  return null;
}

function extractChannelIdFromUrl(url) {
  if (!url) return null;
  const m = url.match(/channel_id=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

function parsePubDate(pubDate) {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
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

async function storeVideo(env, video) {
  const sortDate = video.publishedAt || new Date().toISOString();
  const core = {
    video_id: video.videoId,
    title: video.title,
    thumbnail: video.thumbnail,
    channel: video.channelName,
    category: video.category,
    language: video.language || 'en',
    // Use YouTube publish time for sorting until published_at column is migrated
    fetched_at: sortDate,
  };
  const extended = {
    ...core,
    ...(video.channelId ? { channel_id: video.channelId } : {}),
    published_at: sortDate,
  };

  const ok = await upsertRow(env, 'videos', extended, 'video_id');
  if (ok) return true;
  return upsertRow(env, 'videos', core, 'video_id');
}
