'use client';

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Video } from 'lucide-react';
import Layout from '../components/Layout';
import VideoEmbed from '../components/VideoEmbed';
import VideoLanguageFilter from '../components/VideoLanguageFilter';
import EmptyState from '../components/EmptyState';
import { useVideos } from '../hooks/useVideos';
import { channelsForVideoLanguage, isVideoLanguageCode } from '../config/video-languages';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';

function defaultVideoLanguage(siteLangFilter) {
  if (siteLangFilter && isVideoLanguageCode(siteLangFilter)) return siteLangFilter;
  return 'all';
}

function VideosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language: siteLanguage } = useLanguage();
  const siteLangFilter = toFirestoreLanguageFilter(siteLanguage);

  const urlLang = searchParams.get('lang');
  const initialLang = urlLang && isVideoLanguageCode(urlLang)
    ? urlLang
    : defaultVideoLanguage(siteLangFilter);

  const [activeLanguage, setActiveLanguage] = useState(initialLang);
  const [activeChannel, setActiveChannel] = useState('all');
  const { videos, loading } = useVideos(activeChannel, { videoLanguage: activeLanguage });

  useEffect(() => {
    if (urlLang && isVideoLanguageCode(urlLang) && urlLang !== activeLanguage) {
      setActiveLanguage(urlLang);
    }
  }, [urlLang, activeLanguage]);

  const visibleChannels = useMemo(
    () => channelsForVideoLanguage(activeLanguage),
    [activeLanguage]
  );

  useEffect(() => {
    if (activeChannel === 'all') return;
    if (!visibleChannels.some(c => c.channelId === activeChannel)) {
      setActiveChannel('all');
    }
  }, [activeChannel, visibleChannels]);

  const handleLanguageChange = (code) => {
    setActiveLanguage(code);
    setActiveChannel('all');
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (code === 'all') params.delete('lang');
    else params.set('lang', code);
    const qs = params.toString();
    router.push(qs ? `/videos?${qs}` : '/videos', { scroll: false });
  };

  const emptyDescription = activeLanguage === 'all'
    ? "We're syncing the latest videos from regional news channels. Check back shortly."
    : 'No videos found for this language yet. Try All Languages or another regional feed.';

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Latest Videos</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Regional news channels in Malayalam, Tamil, Telugu, Kannada, and Bengali
      </p>

      <div className="mb-6">
        <VideoLanguageFilter activeLanguage={activeLanguage} onChange={handleLanguageChange} />
      </div>

      <div className="relative min-w-0 -mx-4 sm:mx-0 sm:px-0 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 px-4 sm:px-0">
          Channel
        </p>
        <div
          className="overflow-x-auto scrollbar-hide overscroll-x-contain pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="Video channels"
        >
          <div className="flex gap-2 w-max pr-1">
            <button
              type="button"
              onClick={() => setActiveChannel('all')}
              className={`category-pill flex-shrink-0 whitespace-nowrap ${activeChannel === 'all' ? 'category-pill-active' : 'category-pill-inactive'}`}
            >
              All Channels
            </button>
            {visibleChannels.map(channel => (
              <button
                key={channel.channelId}
                type="button"
                onClick={() => setActiveChannel(channel.channelId)}
                className={`category-pill flex-shrink-0 whitespace-nowrap ${activeChannel === channel.channelId ? 'category-pill-active' : 'category-pill-inactive'}`}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </div>
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
          description={emptyDescription}
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
}

function VideosFallback() {
  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="h-10 skeleton w-48 rounded-xl mb-6" />
      <div className="flex gap-2 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-24 skeleton rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-video skeleton rounded-2xl" />
        ))}
      </div>
    </Layout>
  );
}

const Videos = () => (
  <Suspense fallback={<VideosFallback />}>
    <VideosContent />
  </Suspense>
);

export default Videos;
