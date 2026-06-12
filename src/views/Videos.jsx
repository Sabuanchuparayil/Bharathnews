'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Video } from 'lucide-react';
import Layout from '../components/Layout';
import VideoEmbed from '../components/VideoEmbed';
import EmptyState from '../components/EmptyState';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { useVideos } from '../hooks/useVideos';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';

const Videos = () => {
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [activeChannel, setActiveChannel] = useState('all');
  const { videos, loading } = useVideos(activeChannel);

  const visibleChannels = useMemo(
    () => (langFilter ? YOUTUBE_CHANNELS.filter(c => c.language === langFilter) : YOUTUBE_CHANNELS),
    [langFilter]
  );

  useEffect(() => {
    if (activeChannel === 'all') return;
    if (!visibleChannels.some(c => c.channelId === activeChannel)) {
      setActiveChannel('all');
    }
  }, [activeChannel, visibleChannels]);

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Latest Videos</h1>

      <div className="relative min-w-0 -mx-4 sm:mx-0 sm:px-0">
        <div
          className="overflow-x-auto scrollbar-hide overscroll-x-contain pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="Video channels"
        >
          <div className="flex gap-2 w-max pr-1">
            <button
              onClick={() => setActiveChannel('all')}
              className={`category-pill flex-shrink-0 whitespace-nowrap ${activeChannel === 'all' ? 'category-pill-active' : 'category-pill-inactive'}`}
            >
              All Channels
            </button>
            {visibleChannels.map(channel => (
              <button
                key={channel.channelId}
                onClick={() => setActiveChannel(channel.channelId)}
                className={`category-pill flex-shrink-0 whitespace-nowrap ${activeChannel === channel.channelId ? 'category-pill-active' : 'category-pill-inactive'}`}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-8" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card-solid rounded-2xl overflow-hidden">
              <div className="aspect-video skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-4 skeleton w-3/4" />
                <div className="h-3 skeleton w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={Video}
          title="No videos yet"
          description="We're syncing the latest videos from regional news channels. Check back shortly."
          actionLabel="Back to Home"
          actionTo="/"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <VideoEmbed key={`${video.videoId}-${index}`} video={video} />
          ))}
        </div>
      )}
    </Layout>
  );
};

export default Videos;
