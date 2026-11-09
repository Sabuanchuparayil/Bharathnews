'use client';

import { getSupabaseBrowser } from '@/lib/supabase-client';
import { rowsToApp } from '@/lib/db-mapper';
import { SITE_URL } from '@/lib/site-url';
import { pravasiPublicPath } from '@/lib/pravasi';

function storyUrl(article, source) {
  const path = article.publicPath || `/article/${article.slug}`;
  return `${SITE_URL}${path}?utm_source=${source}&utm_medium=social`;
}

function storyTag(article) {
  if (article.publicPath?.startsWith('/pravasi')) return '#PravasiJaalakam';
  return `#${(article.category || 'news').replace(/\s+/g, '')}`;
}

const ENGAGEMENT_WEIGHTS = {
  views: 1,
  likes: 5,
  bookmarks: 3,
  shares: 4,
  recency: 2,
};

const calculateTrendScore = (article) => {
  const now = Date.now();
  const publishedMs = article.publishedAt?.seconds
    ? article.publishedAt.seconds * 1000
    : (article.publishedAt || now);
  const hoursAge = Math.max(1, (now - publishedMs) / (1000 * 60 * 60));
  const recencyBoost = Math.max(0, 100 - hoursAge * 2);

  return (
    (article.views || 0) * ENGAGEMENT_WEIGHTS.views +
    (article.likes || 0) * ENGAGEMENT_WEIGHTS.likes +
    (article.shares || 0) * ENGAGEMENT_WEIGHTS.shares +
    recencyBoost * ENGAGEMENT_WEIGHTS.recency
  );
};

const PLATFORM_TEMPLATES = {
  telegram: {
    maxLength: 4096,
    format: (article) =>
      `📰 *${article.title}*\n\n${article.summary || ''}\n\n🔗 Read more: ${storyUrl(article, 'telegram')}\n\n${storyTag(article)} #BharathNews`,
  },
  whatsapp: {
    maxLength: 65536,
    format: (article) =>
      `*${article.title}*\n\n${article.summary || ''}\n\n📖 Read: ${storyUrl(article, 'whatsapp')}`,
  },
  facebook: {
    maxLength: 63206,
    format: (article) =>
      `${article.title}\n\n${article.summary || ''}\n\n${storyUrl(article, 'facebook')}`,
  },
  twitter: {
    maxLength: 280,
    format: (article) => {
      const url = storyUrl(article, 'twitter');
      const hashtag = storyTag(article);
      const maxTitleLen = 280 - url.length - hashtag.length - 5;
      const title = article.title.length > maxTitleLen
        ? article.title.slice(0, maxTitleLen - 3) + '...'
        : article.title;
      return `${title}\n\n${url}\n${hashtag}`;
    },
  },
  instagram: {
    maxLength: 2200,
    format: (article) =>
      `${article.title}\n\n${article.summary || ''}\n\n📰 Link in bio\n\n#BharathNews ${storyTag(article)} #IndiaNews #GCCNews`,
  },
};

const getRecommendedPlatforms = (article) => {
  const platforms = [];
  const score = calculateTrendScore(article);

  platforms.push({ platform: 'telegram', priority: 'high', reason: 'Primary news channel' });
  platforms.push({ platform: 'whatsapp', priority: 'high', reason: 'Primary audience channel' });

  if (score > 100 || (article.likes || 0) > 5) {
    platforms.push({ platform: 'facebook', priority: 'medium', reason: 'High engagement article' });
  }

  if (score > 200 || article.category === 'breaking') {
    platforms.push({ platform: 'twitter', priority: 'high', reason: 'Trending — time-sensitive' });
  }

  if (article.imageUrl) {
    platforms.push({ platform: 'instagram', priority: 'low', reason: 'Has visual content' });
  }

  return platforms;
};

export const getSmartPostSuggestions = async (count = 5) => {
  const supabase = getSupabaseBrowser();
  if (!supabase) return [];

  const { data } = await supabase
    .from('articles')
    .select('*')
    .or('editorial_status.eq.published,editorial_status.is.null')
    .order('published_at', { ascending: false })
    .limit(50);

  const { data: creatorRows } = await supabase
    .from('creator_posts')
    .select('*')
    .eq('status', 'published')
    .or('visibility.eq.public,visibility.is.null')
    .order('published_at', { ascending: false })
    .limit(20);

  const articles = [
    ...rowsToApp(data || []),
    ...rowsToApp(creatorRows || []).map(post => ({
      ...post,
      summary: post.excerpt || post.summary || '',
      publicPath: pravasiPublicPath(post),
      imageUrl: post.coverImage || '',
    })),
  ];
  const scored = articles.map(article => ({
    ...article,
    trendScore: calculateTrendScore(article),
  }));

  scored.sort((a, b) => b.trendScore - a.trendScore);

  return scored.slice(0, count).map(article => ({
    article,
    trendScore: article.trendScore,
    tier: article.trendScore > 500 ? 'viral' : article.trendScore > 200 ? 'trending' : article.trendScore > 50 ? 'rising' : 'standard',
    recommendedPlatforms: getRecommendedPlatforms(article),
    generatedPosts: Object.fromEntries(
      Object.entries(PLATFORM_TEMPLATES).map(([platform, template]) => [
        platform,
        template.format(article),
      ])
    ),
  }));
};

export const getOptimalPostingTimes = () => [
  { time: '7:00 AM IST / 5:30 AM GST', label: 'Morning commute', quality: 'high' },
  { time: '12:30 PM IST / 11:00 AM GST', label: 'Lunch break', quality: 'high' },
  { time: '6:00 PM IST / 4:30 PM GST', label: 'Evening peak', quality: 'highest' },
  { time: '9:00 PM IST / 7:30 PM GST', label: 'Night wind-down', quality: 'medium' },
];

export const logSocialPost = async (articleId, platforms, userId) => {
  void articleId; void platforms; void userId;
  /* social_posts table optional */
};

export const getSocialPostHistory = async (_count = 20) => [];

export { PLATFORM_TEMPLATES, calculateTrendScore };
