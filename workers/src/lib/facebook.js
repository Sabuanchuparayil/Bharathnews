import { resolveFacebookConfig } from './site-settings.js';
import { patchRow } from './supabase-rest.js';
import { resolveSocialImageUrl } from './image-resolver.js';

function buildPostMessage(article, articleUrl) {
  return `📰 ${article.title}\n\n${article.summary || ''}\n\n🔗 ${articleUrl}`.trim();
}

/** Parse Graph API error body — detect expired/invalid tokens (code 190). */
export function parseFacebookError(raw) {
  const text = String(raw || '');
  try {
    const parsed = JSON.parse(text);
    const err = parsed.error || parsed;
    const code = err.code ?? err.error_subcode;
    const msg = err.message || text;
    const tokenExpired = code === 190 || /session has expired|invalid oauth/i.test(msg);
    const missingPermissions = code === 200 || /pages_manage_posts|pages_read_engagement/i.test(msg);
    return { message: msg, tokenExpired, missingPermissions, code };
  } catch {
    return {
      message: text.slice(0, 300),
      tokenExpired: /session has expired|OAuthException|code.:190/i.test(text),
      code: null,
    };
  }
}

/** Quick token health check for pipeline-status. */
export async function checkFacebookToken(env) {
  if (!env.FACEBOOK_PAGE_TOKEN || !env.FACEBOOK_PAGE_ID) {
    return { valid: false, reason: 'not_configured' };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${env.FACEBOOK_PAGE_ID}?fields=name,id&access_token=${env.FACEBOOK_PAGE_TOKEN}`
    );
    const body = await res.json();
    if (!res.ok) {
      const parsed = parseFacebookError(JSON.stringify(body));
      return { valid: false, reason: parsed.tokenExpired ? 'token_expired' : parsed.missingPermissions ? 'missing_permissions' : 'api_error', message: parsed.message };
    }
    return { valid: true, pageName: body.name, pageId: body.id, canReadPage: true };
  } catch (e) {
    return { valid: false, reason: 'network_error', message: e.message };
  }
}

/**
 * Post to Facebook with an explicit photo URL so each article gets its own thumbnail.
 * Returns { id, post_id } on success, { skipped } or { error } otherwise.
 */
export async function postToFacebook(env, article, settings = {}, { skipPatch = false } = {}) {
  if (!article?.id || !article?.slug || !article?.title) return { skipped: 'invalid_article' };
  if (article.distributed?.facebook || article.facebook_posted_at) return { skipped: 'already_posted' };

  const fb = resolveFacebookConfig(settings, env);
  if (!fb.enabled || !fb.hasToken) return { skipped: 'not_configured' };
  if (!fb.graphApiEnabled) return { skipped: 'graph_api_disabled' };

  const articleLang = article.language || 'en';
  if (fb.postLanguage && articleLang !== fb.postLanguage) {
    return { skipped: `lang_${articleLang}` };
  }

  const score = article.score ?? article.quality_score ?? 0;
  if (score < fb.minScore) return { skipped: `score_${score}` };

  const siteUrl = env.MAIN_SITE_URL || 'https://www.thebharathnews.com';
  const articleUrl = `${siteUrl}/article/${encodeURIComponent(article.slug)}`;
  const message = buildPostMessage(article, articleUrl);
  const imageUrl = resolveSocialImageUrl(article, siteUrl);

  try {
    // Photo post with explicit URL — bypasses FB link-scraper cache
    let response = await fetch(`https://graph.facebook.com/v21.0/${env.FACEBOOK_PAGE_ID}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: imageUrl,
        caption: message,
        access_token: env.FACEBOOK_PAGE_TOKEN,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.warn(`[facebook] photo post failed for ${article.slug}, trying link post:`, response.status, body.slice(0, 200));

      response = await fetch(`https://graph.facebook.com/v21.0/${env.FACEBOOK_PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          link: articleUrl,
          access_token: env.FACEBOOK_PAGE_TOKEN,
        }),
      });

      if (!response.ok) {
        const linkBody = await response.text();
        console.error('Facebook post failed:', response.status, linkBody);
        const parsed = parseFacebookError(linkBody);
        return { error: parsed.message, tokenExpired: parsed.tokenExpired, missingPermissions: parsed.missingPermissions };
      }
    }

    const result = await response.json();
    console.log('Facebook posted:', article.slug, result.id || result.post_id, 'image:', imageUrl.slice(0, 80));

    if (!skipPatch) {
      await patchRow(env, 'articles', 'id', article.id, {
        facebook_posted_at: new Date().toISOString(),
        distributed: { ...(article.distributed || {}), facebook: true },
      });
    }

    return result;
  } catch (err) {
    console.error('Facebook post error:', err.message);
    return { error: err.message };
  }
}
