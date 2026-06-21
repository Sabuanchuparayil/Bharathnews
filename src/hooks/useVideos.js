'use client';

import { useState, useEffect, useRef } from 'react';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { getVideoFeeds } from '../services/articles';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';

const videoCache = new Map();
const CACHE_TTL = 2 * 60 * 1000;

function normalizeFirestoreVideo(video) {
  const channelName = video.channelName || video.channel || '';
  let channelId = video.channelId || null;
  if (!channelId && channelName) {
    const match = YOUTUBE_CHANNELS.find(c => c.name === channelName);
    channelId = match?.channelId || null;
  }

  const publishedAt = video.publishedAt?.seconds
    ? new Date(video.publishedAt.seconds * 1000).toISOString()
    : typeof video.publishedAt === 'string'
      ? video.publishedAt
      : video.fetchedAt?.seconds
        ? new Date(video.fetchedAt.seconds * 1000).toISOString()
        : null;

  return {
    title: video.title,
    videoId: video.videoId,
    channelName,
    channelId,
    thumbnail: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
    publishedAt,
    category: video.category,
    language: video.language,
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
      language: channel.language || 'en',
    };
  }).filter(Boolean);
};

function channelIdForVideo(video) {
  if (video.channelId) return video.channelId;
  const name = video.channelName || video.channel;
  return YOUTUBE_CHANNELS.find(c => c.name === name)?.channelId || null;
}

function sortVideosByRecency(videos) {
  return [...videos].sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });
}

function resolveVideoLanguageFilter(langFilter) {
  // Regional YouTube feeds are ml/ta/te/kn/bn — English/Hindi site language should still show them
  if (!langFilter || langFilter === 'all' || langFilter === 'en' || langFilter === 'hi') return null;
  return langFilter;
}

async function fetchFromFirestore(channelId, langFilter) {
  const videoLang = resolveVideoLanguageFilter(langFilter);
  const category = channelId === 'all' ? null : YOUTUBE_CHANNELS.find(c => c.channelId === channelId)?.category || null;
  const count = channelId === 'all' ? 120 : 40;

  let videos = await getVideoFeeds(category, count, videoLang);

  if (!videos.length && videoLang) {
    videos = await getVideoFeeds(category, count, null);
    videos = videos.filter(v => (v.language || 'en') === videoLang);
  }

  const filtered = channelId === 'all'
    ? videos
    : videos.filter(v => channelIdForVideo(v) === channelId);

  return sortVideosByRecency(
    filtered.map(normalizeFirestoreVideo).filter(v => v.videoId)
  );
}

async function fetchFromRss2Json(channelId, langFilter) {
  const videoLang = resolveVideoLanguageFilter(langFilter);
  let channels = channelId === 'all'
    ? YOUTUBE_CHANNELS
    : YOUTUBE_CHANNELS.filter(c => c.channelId === channelId);

  if (videoLang) {
    const langChannels = channels.filter(c => c.language === videoLang);
    if (langChannels.length) channels = langChannels;
  }

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
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    const cacheKey = `${channelId}:${language}`;
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setVideos(cached.data);
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      try {
        let allVideos = await fetchFromFirestore(channelId, langFilter);

        if (!allVideos.length) {
          allVideos = await fetchFromRss2Json(channelId, langFilter);
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
  }, [channelId, language, langFilter]);

  return { videos, loading };
}
