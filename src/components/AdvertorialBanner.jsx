import React from 'react';
import { ExternalLink } from 'lucide-react';
import SafeImage from './SafeImage';

const AdvertorialBanner = ({ ad }) => {
  const { title, description, imageUrl, link, sponsoredBy } = ad;

  return (
    <div className="glass-card-solid rounded-2xl p-6 border border-brand-100 dark:border-brand-900/50">
      <div className="flex items-center space-x-4">
        <SafeImage
          src={imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop'}
          alt={title}
          className="w-16 h-16 rounded-xl object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-brand-950/50 px-2 py-1 rounded-full">
              Sponsored
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{sponsoredBy}</span>
          </div>
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium transition-colors text-sm"
          >
            <span>Learn More</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdvertorialBanner;
