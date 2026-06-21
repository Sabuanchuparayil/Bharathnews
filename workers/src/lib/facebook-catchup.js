import { loadSiteSettings } from './sources-loader.js';
import { postToFacebook } from './facebook.js';
import { supabaseHeaders } from './supabase-rest.js';
import { resolveFacebookConfig } from './site-settings.js';

const DEFAULT_BATCH = 1;

function needsFacebookPost(article) {
  const distributed = article.distributed;
  if (typeof distributed === 'object' && distributed?.facebook) return false;
  return true;
}

function matchesLanguage(article, lang) {
  if (!lang) return true;
  return (article.language || 'en') === lang;
}

/**
 * Retry Graph API posts for published articles not yet marked distributed.facebook.
 * Only runs when FACEBOOK_PAGE_TOKEN is set and integrations.facebook.graphApiEnabled is true
 * (keep false when dlvr.it handles Facebook to avoid duplicate posts).
 */
export async function facebookCatchupUndistributed(env, { batch = DEFAULT_BATCH } = {}) {
  const settings = await loadSiteSettings(env);
  const fb = resolveFacebookConfig(settings, env);
  if (!fb.enabled || !fb.graphApiEnabled) {
    return { distributed: 0, skipped: 'graph_api_disabled' };
  }

  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = supabaseHeaders(env);
  const fetchLimit = Math.min(Math.max(batch * 8, 15), 50);

  const langFilter = fb.postLanguage ? `&language=eq.${encodeURIComponent(fb.postLanguage)}` : '';
  const res = await fetch(
    `${base}/articles?editorial_status=eq.published&or=(distributed->facebook.is.null,distributed->facebook.eq.false)${langFilter}&order=published_at.desc&limit=${fetchLimit}&select=id,slug,title,summary,score,quality_score,distributed,language,image_url,source_url,category`,
    { headers }
  );
  if (!res.ok) return { distributed: 0, error: `fetch failed: ${res.status}` };

  const articles = (await res.json()).filter(a => {
    if (!needsFacebookPost(a)) return false;
    if (!matchesLanguage(a, fb.postLanguage)) return false;
    const score = a.score ?? a.quality_score ?? 0;
    return score >= fb.minScore;
  });
  if (!articles.length) return { distributed: 0, total: 0, skipped: 'no_matching_articles' };

  let distributed = 0;
  const errors = [];

  for (const article of articles.slice(0, batch)) {
    try {
      const result = await postToFacebook(env, article, settings);
      if (result?.id || result?.post_id) distributed++;
    } catch (e) {
      errors.push({ slug: article.slug, error: e.message });
      console.error(`[facebook-catchup] ${article.slug}: ${e.message}`);
    }
  }

  return { distributed, total: articles.length, errors };
}
