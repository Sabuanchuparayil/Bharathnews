'use client';

import React, { useState, useEffect } from 'react';
import { Rss, ExternalLink, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const stripHtml = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>?/g, '');
  }
};

const RSSFeed = ({ feedUrl, title }) => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRSS = async () => {
      try {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch RSS feed');
        const data = await response.json();
        if (data.status !== 'ok') throw new Error(data.message || 'Failed to load RSS feed');
        setFeedItems(data.items.slice(0, 5).map(item => ({
          title: item.title || 'Untitled',
          link: item.link || '#',
          description: item.description || '',
          pubDate: item.pubDate || new Date().toISOString(),
          category: item.category || 'General',
        })));
      } catch (err) {
        setError(`${title}: Failed to load RSS feed.`);
      }
      setLoading(false);
    };
    if (feedUrl) fetchRSS();
  }, [feedUrl, title]);

  if (loading) {
    return (
      <div className="glass-card-solid rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Rss className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-4 skeleton" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card-solid rounded-2xl p-6">
        <div className="flex items-center space-x-2 mb-4">
          <AlertCircle className="w-5 h-5 text-accent-rose" />
          <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-accent-rose text-sm mb-4">{error}</p>
        <a href={feedUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-medium text-sm transition-colors">
          View original RSS feed
        </a>
      </div>
    );
  }

  return (
    <div className="glass-card-solid rounded-2xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Rss className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {feedItems.map((item, index) => (
          <article key={index} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-b-0 last:pb-0">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                {item.title}
              </a>
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
              {stripHtml(item.description)}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{item.category}</span>
              <span>{formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default RSSFeed;
