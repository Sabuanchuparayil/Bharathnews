import { supabaseHeaders } from '../lib/supabase-rest.js';
import { slugifyArticle, isAsciiSlug } from '../lib/article-slug.js';

export async function handleFixSlugs(env, { language } = {}) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const headers = supabaseHeaders(env);

  let url = `${base}/articles?select=id,slug,title,language,source_url&or=(editorial_status.eq.published,editorial_status.is.null)&order=created_at.desc&limit=500`;
  if (language) url += `&language=eq.${encodeURIComponent(language)}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    return { ok: false, error: `fetch failed: ${res.status}` };
  }

  const articles = await res.json();
  const toFix = (articles || []).filter(a => a.slug && !isAsciiSlug(a.slug));

  let fixed = 0;
  const errors = [];

  for (const article of toFix) {
    const newSlug = slugifyArticle(article.title, {
      language: article.language || 'en',
      sourceUrl: article.source_url || '',
      id: article.id,
    });

    if (newSlug === article.slug) continue;

    try {
      const patchRes = await fetch(`${base}/articles?id=eq.${article.id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ slug: newSlug }),
      });
      if (!patchRes.ok) {
        errors.push({ id: article.id, error: `articles patch ${patchRes.status}` });
        continue;
      }

      await fetch(`${base}/raw_articles?slug=eq.${encodeURIComponent(article.slug)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ slug: newSlug }),
      }).catch(() => {});

      fixed++;
    } catch (e) {
      errors.push({ id: article.id, error: e.message });
    }
  }

  console.log(`[fix-slugs] Fixed ${fixed}/${toFix.length} non-ASCII slugs${language ? ` (${language})` : ''}`);
  return { ok: true, scanned: articles.length, needsFix: toFix.length, fixed, errors: errors.slice(0, 5) };
}
