'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { HEADER_NAV } from '../config/feeds.config';

const NotFound = () => (
  <Layout showChatbot={false}>
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 md:py-32 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-brand-500 to-brand-700 rounded-3xl shadow-floating mb-8">
          <span className="font-display font-bold text-4xl text-white">404</span>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
          Page not found
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg mb-8 max-w-md mx-auto">
          The story you&apos;re looking for may have moved or no longer exists. Let&apos;s get you back to the news.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary flex items-center space-x-2 px-6">
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link href="/search" className="btn-secondary flex items-center space-x-2 px-6">
            <Search className="w-4 h-4" />
            <span>Search News</span>
          </Link>
        </div>

        <div className="mt-12 glass-card-solid rounded-2xl p-6 text-left">
          <h2 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-3">Popular sections</h2>
          <div className="flex flex-wrap gap-2">
            {HEADER_NAV.filter(n => n.sectionId !== 'top-stories').map(link => (
              <Link
                key={link.path}
                href={link.path}
                className="category-pill category-pill-inactive text-xs flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3 rotate-180" />
                <span>{link.label}</span>
              </Link>
            ))}
            <Link href="/explore" className="category-pill category-pill-inactive text-xs">Discover</Link>
          </div>
        </div>
      </motion.div>
    </div>
  </Layout>
);

export default NotFound;
