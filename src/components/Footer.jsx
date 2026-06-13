'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Globe, Smartphone } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const FOOTER_NEWS_LINKS = [
  { path: '/explore', title: 'All Categories' },
  { path: '/videos', title: 'Videos' },
  { path: '/community', title: 'Community' },
];

const Footer = () => {
  const year = new Date().getFullYear();
  const { siteName, tagline, socialChannels } = useSiteSettings();
  const channelList = Object.values(socialChannels || {});

  return (
    <footer className="bg-surface-1 dark:bg-dark-surface-0 border-t border-gray-100 dark:border-gray-800 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
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
              {tagline || 'Your trusted source for India-GCC news. Breaking news, business, technology — in English and regional languages.'}
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">News</h4>
            <ul className="space-y-2.5">
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
            <ul className="space-y-2.5">
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

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[
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

        {/* Branding */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center space-x-3 mb-2">
              <img
                src="/logo-mark.png"
                alt="The Bharath News"
                className="w-9 h-9 rounded-lg"
              />
              <h2 className="font-display font-bold text-2xl sm:text-3xl bg-gradient-to-r from-brand-700 via-brand-500 to-accent-emerald bg-clip-text text-transparent">
                The Bharath News
              </h2>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide uppercase font-medium">
              AI-Powered News for India &amp; GCC
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-gray-400 flex items-center space-x-1">
              <span>&copy; {year} {siteName || 'The Bharath News'}.</span>
              <span className="hidden sm:inline">Made with</span>
              <Heart className="w-3.5 h-3.5 text-accent-rose hidden sm:inline" />
              <span className="hidden sm:inline">in India</span>
            </p>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-400 bg-surface-2 dark:bg-dark-surface-2 px-3 py-1 rounded-full flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span>EN | ML | AR</span>
              </span>
              <span className="text-xs text-gray-400 bg-surface-2 dark:bg-dark-surface-2 px-3 py-1 rounded-full flex items-center space-x-1">
                <Smartphone className="w-3 h-3" />
                <span>PWA</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
