import React from 'react';
import { Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const VideoEmbed = ({ video, compact = false }) => {
  const { title, videoId, channelName, thumbnail, publishedAt } = video;
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (compact) {
    return (
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
      >
        <img
          src={thumbnail || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
          alt={title}
          className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 line-clamp-2 group-hover:text-brand-700 transition-colors text-sm">
            {title}
          </h4>
          <p className="text-xs text-gray-500 mt-1">{channelName}</p>
          {publishedAt && (
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
            </p>
          )}
        </div>
      </a>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="relative aspect-video">
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-display font-bold text-lg text-gray-900 line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
          <span>{channelName}</span>
          {publishedAt && (
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}</span>
            </span>
          )}
        </div>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-1 text-brand-700 hover:text-brand-800 text-sm mt-3 font-medium transition-colors"
        >
          <span>Watch on YouTube</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default VideoEmbed;
