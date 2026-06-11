import React from 'react';
import { ExternalLink } from 'lucide-react';

const AdvertorialBanner = ({ ad }) => {
  const { title, description, imageUrl, link, sponsoredBy } = ad;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 shadow-md">
      <div className="flex items-center space-x-4">
        <img
          src={imageUrl || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=100&h=100&fit=crop'}
          alt={title}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
              Sponsored
            </span>
            <span className="text-sm text-gray-500">{sponsoredBy}</span>
          </div>
          <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {description}
          </p>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
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