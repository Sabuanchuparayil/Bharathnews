'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Bookmark, Heart, Clock, Eye, MessageCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import AdSlot from '../components/AdSlot';
import ChannelFollowCTA from '../components/ChannelFollowCTA';
import ReadingProgress from '../components/ReadingProgress';
import ArticleFloatingBar from '../components/ArticleFloatingBar';
import ArticleRelated from '../components/ArticleRelated';
import { resolveArticleImage } from '../utils/articleImages';
import { getCategoryColor, getCategoryLabel } from '../utils/categoryColors';
import { getArticleBySlug, trackArticleView } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import { useInterests } from '../context/InterestContext';

const Article = ({ slug: slugProp, initialArticle = null }) => {
  const slug = slugProp;
  const { user, isBookmarked, isLiked, toggleBookmark, toggleLike } = useAuth();
  const { trackRead, trackBookmark } = useInterests();
  const [article, setArticle] = useState(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
  const startTime = useRef(Date.now());
  const heroRef = useRef(null);
  const articleRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const imageScale = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [1, 1] : [1, 1.15]);
  const imageY = useTransform(scrollYProgress, [0, 1], prefersReducedMotion ? [0, 0] : [0, 60]);

  useEffect(() => {
    if (initialArticle) {
      articleRef.current = initialArticle;
      trackArticleView(initialArticle.id);
    }
  }, [initialArticle]);

  useEffect(() => {
    if (initialArticle) return undefined;
    const fetchArticle = async () => {
      const data = await getArticleBySlug(slug);
      if (data) {
        setArticle(data);
        articleRef.current = data;
        trackArticleView(data.id);
      }
      setLoading(false);
    };
    fetchArticle();

    return () => {
      if (articleRef.current) {
        const duration = Math.floor((Date.now() - startTime.current) / 1000);
        trackRead(articleRef.current, duration);
      }
    };
  }, [slug]);

  const handleBookmark = async () => {
    if (!user) { toast.info('Please sign in to bookmark articles'); return; }
    if (!article?.id) return;
    const nowBookmarked = await toggleBookmark(article.id);
    trackBookmark(article);
    toast.success(nowBookmarked ? 'Article bookmarked!' : 'Removed from bookmarks');
  };

  const handleLike = async () => {
    if (!user) { toast.info('Please sign in to like articles'); return; }
    if (!article?.id) return;
    await toggleLike(article.id);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="h-8 skeleton w-3/4 mb-4" />
          <div className="h-64 skeleton rounded-2xl mb-4" />
          <div className="space-y-3">
            <div className="h-4 skeleton" />
            <div className="h-4 skeleton w-5/6" />
            <div className="h-4 skeleton w-4/6" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Article not found</h1>
          <Link href="/" className="text-brand-600 dark:text-brand-400 mt-4 inline-block hover:text-brand-700 transition-colors">
            Back to home
          </Link>
        </div>
      </Layout>
    );
  }

  const readTime = article.readTime || Math.max(1, Math.ceil((article.fullContent?.length || 0) / 1000));
  const publishedDate = article.publishedAt?.seconds
    ? article.publishedAt.seconds * 1000
    : article.publishedAt;

  const displayTitle = article.title;
  const displaySummary = article.summary;
  const displayContent = article.fullContent;

  return (
    <Layout>
      <ReadingProgress readTimeMinutes={readTime} />
      <ArticleFloatingBar
        shareTitle={displayTitle}
        shareText={displaySummary}
        sharePath={`/article/${slug}`}
        onBookmark={handleBookmark}
        likes={article.likes || 0}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/"
          className="inline-flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400 py-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to news</span>
        </Link>

        <article>
          <header className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getCategoryColor(article.category)}`}>
              {getCategoryLabel(article.category)}
            </span>
            <h1 className="font-display font-bold text-3xl md:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4 leading-tight text-balance">
              {displayTitle}
            </h1>
            {displaySummary && (
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed line-clamp-3">
                {displaySummary}
              </p>
            )}
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{article.author}</span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{publishedDate ? formatDistanceToNow(new Date(publishedDate), { addSuffix: true }) : ''}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Eye className="w-4 h-4" />
                <span>{article.views?.toLocaleString() || 0} views</span>
              </span>
              <span className="text-brand-600 dark:text-brand-400 font-medium">{readTime} min read</span>
              {article.source && <span>Source: {article.source}</span>}
            </div>
          </header>

          <div ref={heroRef} className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <motion.img
              src={resolveArticleImage(article)}
              alt={article.title}
              style={{ scale: imageScale, y: imageY }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          </div>

          <AdSlot className="mb-8" />

          <div className="article-drop-cap prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed mb-8">
            {displayContent?.split('\n').filter(Boolean).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4 border-t border-b border-gray-200 dark:border-gray-800 mb-8">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <ShareButton
                title={displayTitle}
                text={displaySummary}
                path={`/article/${slug}`}
                contentType="article"
                showLabel
                size="lg"
              />
              <button onClick={handleBookmark} className={`touch-target flex items-center space-x-2 transition-colors ${article.id && isBookmarked(article.id) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-600 dark:text-gray-400 hover:text-brand-700 dark:hover:text-brand-400'}`}>
                <Bookmark className={`w-5 h-5 ${article.id && isBookmarked(article.id) ? 'fill-current' : ''}`} />
                <span>{article.id && isBookmarked(article.id) ? 'Saved' : 'Bookmark'}</span>
              </button>
              <button onClick={handleLike} className={`touch-target flex items-center space-x-2 transition-colors ${article.id && isLiked(article.id) ? 'text-accent-rose' : 'text-gray-600 dark:text-gray-400 hover:text-accent-rose'}`}>
                <Heart className={`w-5 h-5 ${article.id && isLiked(article.id) ? 'fill-current' : ''}`} />
                <span>Like</span>
              </button>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span>{article.likes || 0}</span>
              </span>
              <span className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span>{article.comments || 0}</span>
              </span>
            </div>
          </div>

          <ChannelFollowCTA />
          <ArticleRelated category={article.category} currentSlug={slug} />
          <AdSlot className="mt-8" />
        </article>
      </div>
    </Layout>
  );
};

export default Article;
