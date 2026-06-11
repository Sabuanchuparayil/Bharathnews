import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VideoEmbed from '../components/VideoEmbed';
import { YOUTUBE_CHANNELS } from '../config/feeds.config';
import { useVideos } from '../hooks/useVideos';

const Videos = () => {
  const [activeChannel, setActiveChannel] = useState('all');
  const { videos, loading } = useVideos(activeChannel);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Latest Videos</h1>

        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveChannel('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeChannel === 'all' ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Channels
          </button>
          {YOUTUBE_CHANNELS.map(channel => (
            <button
              key={channel.channelId}
              onClick={() => setActiveChannel(channel.channelId)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeChannel === channel.channelId ? 'bg-brand-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {channel.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl shadow-md overflow-hidden">
                <div className="aspect-video bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <VideoEmbed key={`${video.videoId}-${index}`} video={video} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Videos;
