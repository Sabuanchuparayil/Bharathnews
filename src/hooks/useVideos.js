'use client';

import { useState, useEffect, useRef } from 'react';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { channelsForVideoLanguage } from '../config/video-languages';
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

/**
 * @param {string|null} langCode - language code or 'all'
 * @param {boolean} explicitPick - true when user chose language on /videos
 */
function resolveVideoLanguageFilter(langCode, explicitPick = false) {
  if (!langCode || langCode === 'all') return null;
  if (explicitPick) return langCode;
  // Site language: en/hi have no dedicated YouTube channels — show all regional feeds
  if (langCode === 'en' || langCode === 'hi') return null;
  return langCode;
}

async function fetchFromFirestore(channelId, langFilter, explicitPick) {
  const videoLang = resolveVideoLanguageFilter(langFilter, explicitPick);
  const category = channelId === 'all' ? null : YOUTUBE_CHANNELS.find(c => c.channelId === channelId)?.category || null;
  const count = channelId === 'all' ? 120 : 40;

  let videos = await getVideoFeeds(category, count, videoLang);

  if (!videos.length && videoLang) {
    videos = await getVideoFeeds(category, count, null);
    videos = videos.filter(v => (v.language || 'en') === videoLang);
  }

  let filtered = channelId === 'all'
    ? videos
    : videos.filter(v => channelIdForVideo(v) === channelId);

  if (videoLang) {
    filtered = filtered.filter(v => (v.language || 'en') === videoLang);
  }

  return sortVideosByRecency(
    filtered.map(normalizeFirestoreVideo).filter(v => v.videoId)
  );
}

async function fetchFromRss2Json(channelId, langFilter, explicitPick) {
  const videoLang = resolveVideoLanguageFilter(langFilter, explicitPick);
  let channels = channelId === 'all'
    ? channelsForVideoLanguage(videoLang ? videoLang : 'all')
    : YOUTUBE_CHANNELS.filter(c => c.channelId === channelId);

  if (videoLang) {
    channels = channels.filter(c => c.language === videoLang);
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

/**
 * @param {string} channelId - 'all' or a YouTube channel id
 * @param {{ videoLanguage?: string|null }} options
 *   videoLanguage: explicit language on /videos ('all', 'ml', 'ta', …). Omit to follow site language.
 */
export function useVideos(channelId = 'all', { videoLanguage = null } = {}) {
  const { language: siteLanguage } = useLanguage();
  const explicitPick = videoLanguage != null;
  const langFilter = explicitPick
    ? (videoLanguage === 'all' ? null : videoLanguage)
    : toFirestoreLanguageFilter(siteLanguage);
  const cacheLangKey = explicitPick ? (videoLanguage || 'all') : siteLanguage;

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;

    const cacheKey = `${channelId}:${cacheLangKey}`;
    const cached = videoCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setVideos(cached.data);
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      setLoading(true);
      try {
        let allVideos = await fetchFromFirestore(channelId, langFilter, explicitPick);

        if (!allVideos.length) {
          allVideos = await fetchFromRss2Json(channelId, langFilter, explicitPick);
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
  }, [channelId, langFilter, cacheLangKey, explicitPick]);

  return { videos, loading };
}
