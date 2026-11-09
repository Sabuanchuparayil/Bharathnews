'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Globe, Smartphone } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const FOOTER_NEWS_LINKS = [
  { path: '/explore', title: 'All Categories' },
  { path: '/videos', title: 'Videos' },
  { path: '/community', title: 'Community' },
  { path: '/jobs', title: 'GCC Jobs' },
  { path: '/classifieds', title: 'Classifieds' },
];

const STALE_TAGLINES = new Set([
  'AI-Powered News for India & GCC',
  'Breaking news from India and GCC regions',
]);
const PUBLIC_TAGLINE = 'Your window to India from the Gulf. News in English and Malayalam.';

const Footer = () => {
  const year = new Date().getFullYear();
  const { siteName, tagline, socialChannels } = useSiteSettings();
  const channelList = Object.values(socialChannels || {});
  const publicTagline = tagline && !STALE_TAGLINES.has(tagline.trim()) ? tagline : PUBLIC_TAGLINE;

  return (
    <footer className="bg-surface-1 dark:bg-dark-surface-0 border-t border-gray-100 dark:border-gray-800 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <img
                src="/logo-mark.png"
                alt="The Bharath News"
                className="w-11 h-11 rounded-xl"
              />
              <span className="font-display font-bold text-lg text-brand-700 dark:text-brand-400">
                {siteName || 'The Bharath News'}
              </span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              {publicTagline}
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">News</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:gap-y-2.5">
              {FOOTER_NEWS_LINKS.map(link => (
                <li key={link.path}>
                  <Link href={link.path} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {channelList.length > 0 && (
          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">Follow Us</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:gap-y-2.5">
              {channelList.map(channel => (
                <li key={channel.name}>
                  <a
                    href={channel.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    {channel.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          )}

          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5 sm:flex-col sm:gap-y-2.5">
              {[
                ['About', '/about'],
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
                ['Editorial Policy', '/editorial'],
                ['Contact', '/contact'],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-4 flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/logo-mark.png"
              alt=""
              className="w-8 h-8 rounded-lg flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display font-bold text-base leading-none bg-gradient-to-r from-brand-700 via-brand-500 to-accent-emerald bg-clip-text text-transparent">
                The Bharath News
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                Your window to India from the Gulf
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>&copy; {year} {siteName || 'The Bharath News'}.</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="w-3.5 h-3.5 text-accent-rose hidden sm:inline" />
            <span className="hidden sm:inline">in India</span>
          </p>
          <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-surface-2 dark:bg-dark-surface-2 px-3 py-1 rounded-full flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>EN | ML</span>
              </span>
              <span className="text-xs text-gray-400 bg-surface-2 dark:bg-dark-surface-2 px-3 py-1 rounded-full flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>PWA</span>
              </span>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
