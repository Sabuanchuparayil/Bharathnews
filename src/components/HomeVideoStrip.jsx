'use client';

import React from 'react';
import Link from 'next/link';
import { Play, ChevronRight } from 'lucide-react';
import SafeImage from './SafeImage';
import { useVideos } from '../hooks/useVideos';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';
import { isVideoLanguageCode } from '@/config/video-languages';

function VideoSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden py-1">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-56 h-36 skeleton rounded-xl" />
      ))}
    </div>
  );
}

export default function HomeVideoStrip() {
  const { language } = useLanguage();
  const siteLang = toFirestoreLanguageFilter(language);
  const videoLang = siteLang && isVideoLanguageCode(siteLang) ? siteLang : 'all';
  const { videos, loading } = useVideos('all', { videoLanguage: videoLang });
  const viewAllHref = videoLang === 'all' ? '/videos' : `/videos?lang=${videoLang}`;

  if (!loading && videos.length === 0) return null;

  return (
    <section className="py-5 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40">
              <Play className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">
              Latest Videos
            </h2>
          </div>
          <Link
            href={viewAllHref}
            className="flex items-center gap-0.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {loading && videos.length === 0 && <VideoSkeleton />}

        {videos.length > 0 && (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {videos.slice(0, 8).map((video, i) => {
              const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
              return (
                <a
                  key={video.videoId || i}
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex-shrink-0 snap-start w-56 sm:w-64"
                >
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-gray-800">
                    <SafeImage
                      src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                      alt={video.title}
                      width={256}
                      height={144}
                      sizes="(max-width: 640px) 224px, 256px"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {video.channelName}
                  </p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
