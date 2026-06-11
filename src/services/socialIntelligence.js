import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase.config';

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
      `📰 *${article.title}*\n\n${article.summary || ''}\n\n🔗 Read more: https://thebharathnews.com/article/${article.slug}\n\n#${(article.category || 'news').replace(/\s+/g, '')} #BharathNews`,
  },
  whatsapp: {
    maxLength: 65536,
    format: (article) =>
      `*${article.title}*\n\n${article.summary || ''}\n\n📖 Read: https://thebharathnews.com/article/${article.slug}?utm_source=whatsapp&utm_medium=social`,
  },
  facebook: {
    maxLength: 63206,
    format: (article) =>
      `${article.title}\n\n${article.summary || ''}\n\nhttps://thebharathnews.com/article/${article.slug}?utm_source=facebook&utm_medium=social`,
  },
  twitter: {
    maxLength: 280,
    format: (article) => {
      const url = `https://thebharathnews.com/article/${article.slug}?utm_source=twitter&utm_medium=social`;
      const hashtag = `#${(article.category || 'news').replace(/\s+/g, '')}`;
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
      `${article.title}\n\n${article.summary || ''}\n\n📰 Link in bio\n\n#BharathNews #${(article.category || 'news').replace(/\s+/g, '')} #IndiaNews #GCCNews #BreakingNews`,
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
  const q = query(
    collection(db, 'articles'),
    orderBy('publishedAt', 'desc'),
    limit(50)
  );
  const snapshot = await getDocs(q);
  const articles = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

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

export const getOptimalPostingTimes = () => {
  const windows = [
    { time: '7:00 AM IST / 5:30 AM GST', label: 'Morning commute', quality: 'high' },
    { time: '12:30 PM IST / 11:00 AM GST', label: 'Lunch break', quality: 'high' },
    { time: '6:00 PM IST / 4:30 PM GST', label: 'Evening peak', quality: 'highest' },
    { time: '9:00 PM IST / 7:30 PM GST', label: 'Night wind-down', quality: 'medium' },
  ];

  return windows;
};

export const logSocialPost = async (articleId, platforms, userId) => {
  await addDoc(collection(db, 'socialPosts'), {
    articleId,
    platforms,
    postedBy: userId,
    postedAt: serverTimestamp(),
  });
};

export const getSocialPostHistory = async (count = 20) => {
  const q = query(
    collection(db, 'socialPosts'),
    orderBy('postedAt', 'desc'),
    limit(count)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
};

export { PLATFORM_TEMPLATES, calculateTrendScore };
