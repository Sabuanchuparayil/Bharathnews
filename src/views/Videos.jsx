'use client';

import React, { useState } from 'react';
import { Video } from 'lucide-react';
import Layout from '../components/Layout';
import VideoEmbed from '../components/VideoEmbed';
import EmptyState from '../components/EmptyState';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { useVideos } from '../hooks/useVideos';

const Videos = () => {
  const [activeChannel, setActiveChannel] = useState('all');
  const { videos, loading } = useVideos(activeChannel);

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Latest Videos</h1>

      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveChannel('all')}
          className={`category-pill ${activeChannel === 'all' ? 'category-pill-active' : 'category-pill-inactive'}`}
        >
          All Channels
        </button>
        {YOUTUBE_CHANNELS.map(channel => (
          <button
            key={channel.channelId}
            onClick={() => setActiveChannel(channel.channelId)}
            className={`category-pill ${activeChannel === channel.channelId ? 'category-pill-active' : 'category-pill-inactive'}`}
          >
            {channel.name}
          </button>
        ))}
      </div>

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
          description="We're syncing the latest videos from India and GCC news channels. Check back shortly."
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
