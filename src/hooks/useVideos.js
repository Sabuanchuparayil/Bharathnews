import { useState, useEffect, useRef } from 'react';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';

const videoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const fetchChannelVideos = async (channel) => {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.status !== 'ok') return [];
  return data.items.slice(0, 5).map(item => ({
    title: item.title,
    videoId: item.link.split('v=')[1] || item.guid?.split(':').pop(),
    channelName: channel.name,
    channelId: channel.channelId,
    thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.link.split('v=')[1]}/mqdefault.jpg`,
    publishedAt: item.pubDate,
    category: channel.category,
  }));
};

export function useVideos(channelId = 'all') {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    const cacheKey = channelId;
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setVideos(cached.data);
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      try {
        const channels = channelId === 'all'
          ? YOUTUBE_CHANNELS
          : YOUTUBE_CHANNELS.filter(c => c.channelId === channelId);

        const results = await Promise.allSettled(
          channels.map(ch => fetchChannelVideos(ch))
        );

        if (abortRef.current) return;

        const allVideos = results
          .filter(r => r.status === 'fulfilled')
          .flatMap(r => r.value);
        allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        videoCache.set(cacheKey, { data: allVideos, ts: Date.now() });
        setVideos(allVideos);
      } catch {
        if (!abortRef.current) setVideos([]);
      }
      if (!abortRef.current) setLoading(false);
    };

    fetchVideos();
    return () => { abortRef.current = true; };
  }, [channelId]);

  return { videos, loading };
}
