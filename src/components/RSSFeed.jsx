import React, { useState, useEffect } from 'react';
import { Rss, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RSSFeed = ({ feedUrl, title }) => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch RSS feed');
        }
        
        const data = await response.json();
        
        if (data.status !== 'ok') {
          throw new Error(data.message || 'Failed to load RSS feed');
        }
        
        const parsedItems = data.items.map(item => ({
          title: item.title || 'Untitled',
          link: item.link || '#',
          description: item.description || '',
          pubDate: item.pubDate || new Date().toISOString(),
          category: item.category || 'General'
        }));
        
        setFeedItems(parsedItems.slice(0, 5));
        setLoading(false);
      } catch (err) {
        setError(`${title} Failed to load RSS feed. Please check your connection or try again later.`);
        setLoading(false);
      }
    };

    if (feedUrl) {
      fetchRSS();
    }
  }, [feedUrl, title]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Rss className="w-5 h-5 text-indigo-700" />
          <h3 className="font-display font-semibold text-lg text-gray-900">{title}</h3>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <h3 className="font-display font-semibold text-lg text-gray-900">{title}</h3>
        </div>
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <div className="pt-4 border-t border-gray-100">
          <a 
            href={feedUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
          >
            View original RSS feed
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Rss className="w-5 h-5 text-indigo-700" />
        <h3 className="font-display font-semibold text-lg text-gray-900">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {feedItems.map((item, index) => (
          <article key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
            <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-indigo-700 transition-colors"
              >
                {item.title}
              </a>
            </h4>
            <p className="text-sm text-gray-600 mb-2 line-clamp-3">
              {item.description.replace(/<[^>]*>/g, '')}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.category}</span>
              <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
            </div>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 text-indigo-700 hover:text-indigo-800 text-sm mt-2 transition-colors"
            >
              <span>Read more</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </article>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <a 
          href={feedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-indigo-700 hover:text-indigo-800 font-medium transition-colors"
        >
          View full RSS feed
        </a>
      </div>
    </div>
  );
};

export default RSSFeed;