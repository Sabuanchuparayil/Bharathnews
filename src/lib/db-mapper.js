/** Map DB snake_case rows to app camelCase (Firestore-compatible shape). */

import { resolveArticleImage } from '../utils/articleImages';

const FIELD_MAP = {
  full_content: 'fullContent',
  image_url: 'imageUrl',
  source_url: 'sourceUrl',
  author_slug: 'authorSlug',
  editorial_status: 'editorialStatus',
  quality_score: 'qualityScore',
  published_at: 'publishedAt',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  fetched_at: 'fetchedAt',
  subscribed_at: 'subscribedAt',
  display_name: 'displayName',
  photo_url: 'photoURL',
  onboarding_complete: 'onboardingComplete',
  source_id: 'sourceId',
  video_id: 'videoId',
  channel_id: 'channelId',
  trust_weight: 'trustWeight',
  last_fetched_at: 'lastFetchedAt',
  last_error: 'lastError',
  item_count: 'itemCount',
  user_id: 'userId',
  requested_role: 'requestedRole',
  portfolio_url: 'portfolioUrl',
  sample_work: 'sampleWork',
  reviewed_at: 'reviewedAt',
  cover_image: 'coverImage',
  social_links: 'socialLinks',
  follower_count: 'followerCount',
  post_count: 'postCount',
  earnings_balance: 'earningsBalance',
  revenue_share_eligible: 'revenueShareEligible',
  author_id: 'authorId',
  author_name: 'authorName',
  author_slug: 'authorSlug',
  video_url: 'videoUrl',
  moderation_feedback: 'moderationFeedback',
  follower_id: 'followerId',
  creator_slug: 'creatorSlug',
  creator_post_id: 'creatorPostId',
  is_citizen_content: 'isCitizenContent',
  telegram_posted_at: 'telegramPostedAt',
  facebook_posted_at: 'facebookPostedAt',
  cluster_id: 'clusterId',
  reject_reason: 'rejectReason',
  detected_language: 'detectedLanguage',
};

const REVERSE_MAP = Object.fromEntries(
  Object.entries(FIELD_MAP).map(([k, v]) => [v, k])
);

function toTimestampField(iso) {
  if (!iso) return null;
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return { seconds: Math.floor(ms / 1000) };
}

export function rowToApp(row) {
  if (!row) return row;
  const out = { id: row.id };
  for (const [key, val] of Object.entries(row)) {
    if (key === 'id') continue;
    const appKey = FIELD_MAP[key] || key;
    if (key.endsWith('_at') && typeof val === 'string') {
      out[appKey] = toTimestampField(val);
      out[`_${appKey}Iso`] = val;
    } else if (key === 'channel' && val) {
      out.channel = val;
      if (!out.channelName) out.channelName = val;
    } else {
      out[appKey] = val;
    }
  }
  out.imageUrl = resolveArticleImage(out);
  return out;
}

export function rowsToApp(rows) {
  return (rows || []).map(rowToApp);
}

export function appToRow(data, extraReverse = {}) {
  if (!data) return data;
  const out = {};
  const reverse = { ...REVERSE_MAP, ...extraReverse };
  for (const [key, val] of Object.entries(data)) {
    if (key === 'id' || key.startsWith('_')) continue;
    const dbKey = reverse[key] || key.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    if (val && typeof val === 'object' && 'seconds' in val) {
      out[dbKey] = new Date(val.seconds * 1000).toISOString();
    } else {
      out[dbKey] = val;
    }
  }
  return out;
}

export function serializeDoc(data) {
  if (!data) return data;
  const out = { ...data };
  for (const field of ['publishedAt', 'createdAt', 'updatedAt', 'fetchedAt', 'subscribedAt', 'reviewedAt']) {
    if (typeof out[field] === 'string') {
      out[field] = toTimestampField(out[field]);
    }
  }
  return out;
}
