'use client';

import React from 'react';
import { Play } from 'lucide-react';
import SafeImage from './SafeImage';
import ShareButton from './ShareButton';

const VideoColumn = ({ videos = [] }) => {
  if (!videos.length) return null;

  return (
    <div className="glass-card-solid rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <h3 className="font-display font-bold text-base text-gray-900 dark:text-white flex items-center space-x-2">
          <Play className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span>Latest Videos</span>
        </h3>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {videos.slice(0, 4).map((video, index) => {
          const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;
          return (
            <div
              key={video.videoId || index}
              className="group flex items-center space-x-3 p-4 hover:bg-surface-2 dark:hover:bg-dark-surface-2 transition-colors"
            >
              <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="flex space-x-3 flex-1 min-w-0">
                <SafeImage
                  src={video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`}
                  alt={video.title}
                  width={112}
                  height={64}
                  sizes="112px"
                  className="w-28 h-16 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-sm">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{video.channelName}</p>
                </div>
              </a>
              <ShareButton
                title={video.title}
                text={video.channelName}
                url={watchUrl}
                contentType="video"
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VideoColumn;
