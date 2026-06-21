/**
 * Social distribution — Telegram channel + Facebook pages.
 * Kept separate from publish crons to stay within Cloudflare subrequest limits.
 */
import { postArticleToTelegram } from './telegram.js';
import { facebookCatchupUndistributed } from './facebook-catchup.js';
import { loadSiteSettings } from './sources-loader.js';
import { resolveFacebookConfig, resolveTelegramConfig } from './site-settings.js';
import { supabaseHeaders } from './supabase-rest.js';
import { getLimits } from './cf-limits.js';
import { isBlockedPublisher } from './blocked-sources.js';

const TELEGRAM_BATCH_FREE = 3;
const TELEGRAM_BATCH_PAID = 5;
const FACEBOOK_BATCH_FREE = 2;
const FACEBOOK_BATCH_PAID = 3;

function telegramBatch(env) {
  return getLimits(env).TIER === 'paid' ? TELEGRAM_BATCH_PAID : TELEGRAM_BATCH_FREE;
}

function facebookBatch(env) {
  return getLimits(env).TIER === 'paid' ? FACEBOOK_BATCH_PAID : FACEBOOK_BATCH_FREE;
}

async function fetchUndistributedTelegram(env, limit) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = supabaseHeaders(env);
  const res = await fetch(
    `${base}/articles?editorial_status=eq.published&telegram_posted_at=is.null&order=created_at.desc&limit=${limit}&select=id,slug,title,summary,score,quality_score,image_url,category,source_url,source,language,distributed`,
    { headers }
  );
  if (!res.ok) return { articles: [], error: `fetch failed: ${res.status}` };
  const articles = (await res.json()).filter(a =>
    !isBlockedPublisher({ name: a.source, sourceUrl: a.source_url })
  );
  return { articles, error: null };
}

/** Post unpublished articles to Telegram (newest first). */
export async function distributeTelegram(env, { batch } = {}) {
  const settings = await loadSiteSettings(env);
  const tg = resolveTelegramConfig(settings, env);
  if (!tg.enabled || !tg.hasBotToken) {
    return { sent: 0, skipped: 'telegram_not_configured' };
  }

  const limit = batch ?? telegramBatch(env);
  const { articles, error } = await fetchUndistributedTelegram(env, limit + 5);
  if (error) return { sent: 0, error };

  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = supabaseHeaders(env);
  const chatId = env.TELEGRAM_CHANNEL || env.TELEGRAM_CHANNEL_ID || tg.channelId;
  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';

  let sent = 0;
  const errors = [];

  for (const article of articles) {
    if (sent >= limit) break;
    const score = article.score ?? article.quality_score ?? 0;
    if (score < tg.minScore) continue;

    try {
      await postArticleToTelegram(env, {
        title: article.title,
        slug: article.slug,
        excerpt: article.summary || '',
        image_url: article.image_url,
        category: article.category,
        source_url: article.source_url,
        siteUrl,
      }, chatId);

      await fetch(`${base}/articles?id=eq.${article.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({
          telegram_posted_at: new Date().toISOString(),
          distributed: {
            ...(typeof article.distributed === 'object' && article.distributed ? article.distributed : {}),
            telegram: true,
          },
        }),
      });
      sent++;
      // Avoid Telegram rate limits (~20 msg/min per channel)
      if (sent < limit) await new Promise(r => setTimeout(r, 350));
    } catch (e) {
      errors.push({ slug: article.slug, error: e.message });
      console.error(`[telegram-distribute] ${article.slug}: ${e.message}`);
    }
  }

  return { sent, pending: articles.length, errors };
}

/** Post + Telegram + Facebook in one lightweight cron pass. */
export async function runSocialDistributionTick(env, options = {}) {
  const tgBatch = options.telegramBatch ?? telegramBatch(env);
  const fbBatch = options.facebookBatch ?? facebookBatch(env);

  const settings = await loadSiteSettings(env);
  const fb = resolveFacebookConfig(settings, env);

  const telegram = await distributeTelegram(env, { batch: tgBatch });

  let facebook = { distributed: 0, skipped: 'graph_api_disabled' };
  if (fb.enabled && fb.graphApiEnabled && fbBatch > 0) {
    facebook = await facebookCatchupUndistributed(env, { batch: fbBatch });
  } else if (fbBatch === 0) {
    facebook = { distributed: 0, skipped: 'batch_zero' };
  }

  const summary = {
    telegramSent: telegram.sent || 0,
    telegramPending: telegram.pending || 0,
    facebookSent: facebook.distributed || 0,
    facebookPending: facebook.total || 0,
    facebookSkipped: facebook.skipped || null,
    errors: [...(telegram.errors || []), ...(facebook.errors || [])],
  };

  console.log('[cron] social-distribute:', summary);
  return summary;
}

/** @deprecated use distributeTelegram */
export async function distributeUndistributed(env) {
  const result = await distributeTelegram(env, { batch: 1 });
  return { distributed: result.sent || 0, total: result.pending || 0, error: result.error };
}

export { telegramBatch, facebookBatch };
