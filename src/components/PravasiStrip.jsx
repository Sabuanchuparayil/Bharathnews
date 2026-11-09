'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublishedPravasiPosts } from '@/services/creator';
import { pravasiPublicPath } from '@/lib/pravasi';

const PravasiStrip = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getPublishedPravasiPosts(4).then(setPosts).catch(() => {});
  }, []);

  if (!posts.length) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-xl text-stone-900 dark:text-white">Latest from Pravasi Jaalakam</h2>
        <Link href="/pravasi" className="text-sm text-brand-700 dark:text-brand-300">All pieces</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {posts.map(post => (
          <Link key={post.id} href={pravasiPublicPath(post)} className="rounded-2xl border border-stone-200 dark:border-white/10 p-4 hover:border-brand-600">
            <p className="text-xs uppercase text-brand-700 dark:text-brand-300">{post.type}</p>
            <h3 className="font-display font-bold text-stone-900 dark:text-white mt-1 line-clamp-2">{post.title}</h3>
            <p className="text-xs text-gray-500 mt-2">{post.authorName}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default PravasiStrip;
