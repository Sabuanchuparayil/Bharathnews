'use client';

import React from 'react';
import Link from 'next/link';
import ShareButton from '../components/ShareButton';
import Layout from '../components/Layout';
import Breadcrumbs from '../components/Breadcrumbs';
import { pravasiPublicPath } from '@/lib/pravasi';

const extractYouTubeId = (url) => {
  const match = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const PravasiPost = ({ post }) => {
  const path = pravasiPublicPath(post);
  const youtubeId = post.type === 'video' ? extractYouTubeId(post.videoUrl) : null;

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Pravasi Jaalakam', href: '/pravasi' },
          { name: post.title },
        ]} />
        {post.coverImage && (
          <img src={post.coverImage} alt="" className="w-full h-64 object-cover rounded-2xl mb-6" />
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">{post.type}</p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 dark:text-white mt-1">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
          <Link href={`/@${post.authorSlug}`} className="font-medium text-brand-700 dark:text-brand-300 hover:underline">
            {post.authorName}
          </Link>
          <ShareButton
            title={post.title}
            text={post.excerpt || ''}
            path={path}
            contentType="pravasi"
            showLabel
            size="lg"
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">Share on WhatsApp, Telegram, Facebook, X, or LinkedIn.</p>
        {youtubeId && (
          <div className="relative aspect-video rounded-2xl overflow-hidden mt-6">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title={post.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        <div className={`mt-8 space-y-4 ${post.type === 'poem' ? 'italic' : ''}`}>
          {(post.body || '').split('\n').filter(line => line.trim()).map((line, index) => (
            <p key={index} className="text-gray-800 dark:text-gray-200 leading-relaxed">{line}</p>
          ))}
        </div>
        <p className="mt-8">
          <Link href="/pravasi" className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:underline">All Pravasi Jaalakam</Link>
        </p>
      </article>
    </Layout>
  );
};

export default PravasiPost;
