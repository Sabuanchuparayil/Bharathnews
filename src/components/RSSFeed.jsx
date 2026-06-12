'use client';

import React, { useState, useEffect } from 'react';
import { Rss } from 'lucide-react';
import RelativeTime from './RelativeTime';
import { getCategoryLabel } from '../utils/categoryColors';

const stripHtml = (html) => {
  if (!html) return '';
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    return html.replace(/<[^>]*>?/g, '');
  }
};

async function fetchViaRss2Json(feedUrl) {
  const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
  if (!res.ok) throw new Error('rss2json HTTP error');
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(data.message || 'rss2json error');
  return data.items;
}

async function fetchViaAllOrigins(feedUrl) {
  const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`);
  if (!res.ok) throw new Error('allorigins HTTP error');
  const text = await res.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'text/xml');
  const items = [...xml.querySelectorAll('item')];
  return items.map(el => ({
    title: el.querySelector('title')?.textContent || '',
    link: el.querySelector('link')?.textContent || '',
    description: el.querySelector('description')?.textContent || '',
    pubDate: el.querySelector('pubDate')?.textContent || '',
    category: el.querySelector('category')?.textContent || '',
  }));
}

function normalizeItems(items) {
  return items.slice(0, 5).map(item => ({
    title: item.title || 'Untitled',
    link: item.link || '#',
    description: item.description || '',
    pubDate: item.pubDate || new Date().toISOString(),
    category: item.category || 'General',
  }));
}

const RSSFeed = ({ feedUrl, title, fallbackUrls = [] }) => {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const urls = [feedUrl, ...fallbackUrls].filter(Boolean);
    let cancelled = false;

    const fetchRSS = async () => {
      for (const url of urls) {
        if (cancelled) return;
        try {
          const items = await fetchViaRss2Json(url);
          if (!cancelled) { setFeedItems(normalizeItems(items)); setLoading(false); }
          return;
        } catch { /* try next strategy */ }

        try {
          const items = await fetchViaAllOrigins(url);
          if (!cancelled) { setFeedItems(normalizeItems(items)); setLoading(false); }
          return;
        } catch { /* try next URL */ }
      }
      if (!cancelled) { setError('Unable to load feed right now.'); setLoading(false); }
    };

    fetchRSS();
    return () => { cancelled = true; };
  }, [feedUrl, fallbackUrls]);

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
    return null;
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
              <span>{getCategoryLabel(item.category)}</span>
              <RelativeTime date={item.pubDate} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default RSSFeed;
