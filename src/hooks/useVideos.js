'use client';

import { useState, useEffect, useRef } from 'react';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { getVideoFeeds } from '../services/firestore';

const videoCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function normalizeFirestoreVideo(video) {
  const publishedAt = video.publishedAt?.seconds
    ? new Date(video.publishedAt.seconds * 1000).toISOString()
    : video.publishedAt || video.fetchedAt?.seconds
      ? new Date(video.fetchedAt.seconds * 1000).toISOString()
      : null;

  return {
    title: video.title,
    videoId: video.videoId,
    channelName: video.channelName,
    channelId: video.channelId,
    thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
    publishedAt,
    category: video.category,
  };
}

function extractVideoId(link, guid) {
  if (!link && guid) {
    const fromGuid = guid.split(':').pop();
    if (fromGuid) return fromGuid;
  }
  if (typeof link === 'string') {
    const vParam = link.match(/[?&]v=([^&]+)/);
    if (vParam) return vParam[1];
    const shortMatch = link.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return shortMatch[1];
  }
  return null;
}

const fetchChannelVideos = async (channel) => {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`;
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) return [];
  const data = await response.json();
  if (data.status !== 'ok') return [];
  return data.items.slice(0, 5).map(item => {
    const videoId = extractVideoId(item.link, item.guid);
    if (!videoId) return null;
    return {
      title: item.title,
      videoId,
      channelName: channel.name,
      channelId: channel.channelId,
      thumbnail: item.thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
      publishedAt: item.pubDate,
      category: channel.category,
    };
  }).filter(Boolean);
};

async function fetchFromFirestore(channelId) {
  const category = channelId === 'all' ? null : YOUTUBE_CHANNELS.find(c => c.channelId === channelId)?.category || null;
  const count = channelId === 'all' ? 40 : 20;
  const videos = await getVideoFeeds(category, count);

  const filtered = channelId === 'all'
    ? videos
    : videos.filter(v => v.channelId === channelId);

  return filtered.map(normalizeFirestoreVideo).filter(v => v.videoId);
}

async function fetchFromRss2Json(channelId) {
  const channels = channelId === 'all'
    ? YOUTUBE_CHANNELS
    : YOUTUBE_CHANNELS.filter(c => c.channelId === channelId);

  const results = await Promise.allSettled(
    channels.map(ch => fetchChannelVideos(ch))
  );

  const allVideos = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);

  allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return allVideos;
}

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
        let allVideos = await fetchFromFirestore(channelId);

        if (!allVideos.length) {
          allVideos = await fetchFromRss2Json(channelId);
        }

        if (abortRef.current) return;

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
