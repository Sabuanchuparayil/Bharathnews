/**
 * Fast publish — skip Claude classification and Llama rewriting.
 * Publishes RSS content directly to the articles table for maximum throughput.
 */
import { isCategoryFallbackImage, resolveArticleImage, isRealArticleImage } from '../lib/image-resolver.js';
import { resolveArticleBody } from '../lib/article-content.js';
import { runQuery, upsertRow, patchRawArticle, patchRow, selectRows, supabaseHeaders } from '../lib/supabase-rest.js';
import { onArticlePublished } from '../lib/on-article-published.js';
import { postToFacebook } from '../lib/facebook.js';
import { loadSiteSettings } from '../lib/sources-loader.js';
import { enqueueDistributionJobs } from '../lib/distribution-jobs.js';

import { getLimits, getCronPublishOpts } from '../lib/cf-limits.js';
import { isBlockedPublisher } from '../lib/blocked-sources.js';

async function fetchPending(env, status, limit) {
  return runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: status },
      },
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
    limit,
  }, null);
}

async function publishOne(env, raw, { skipImageResolve = false, skipSourceFetch = false, requireRealImage = false } = {}) {
  const slug = raw.slug || raw.id;
  if (!slug || !raw.title?.trim()) return 'skipped';

  if (isBlockedPublisher({
    name: raw.source || '',
    sourceUrl: raw.sourceUrl || raw.source_url || '',
  })) {
    await patchRawArticle(env, slug, { status: 'rejected', editorial_status: 'rejected', reject_reason: 'blocked_publisher' });
    return 'skipped';
  }

  const category = raw.category || 'india';
  const lang = raw.language || raw.detectedLanguage || raw.detected_language || 'en';
  const needsRealImage = requireRealImage || lang === 'ml';
  const body = await resolveArticleBody(raw, { skipSourceFetch: skipSourceFetch || skipImageResolve });

  let imageUrl = raw.imageUrl || raw.image_url || '';
  if (needsRealImage || !skipImageResolve) {
    imageUrl = await resolveArticleImage({
      imageUrl: raw.imageUrl || raw.image_url || '',
      sourceUrl: raw.sourceUrl || raw.source_url || '',
      category,
      slug,
      title: raw.title,
      ogTimeoutMs: needsRealImage ? 4000 : 2500,
    });
  } else if (!imageUrl || isCategoryFallbackImage(imageUrl)) {
    imageUrl = raw.imageUrl || raw.image_url || '';
  }

  if (needsRealImage && !isRealArticleImage(imageUrl)) {
    return 'skipped';
  }

  const summary = body.slice(0, 300) || raw.title.slice(0, 300);

  try {
    const ok = await upsertRow(env, 'articles', {
      slug,
      title: raw.title.trim(),
      summary,
      full_content: body || raw.title.trim(),
      image_url: imageUrl,
      category,
      subcategory: raw.subcategory || null,
      region: raw.region || 'india',
      language: lang,
      source: raw.source || 'RSS',
      source_url: raw.sourceUrl || raw.source_url || '',
      author: 'The Bharath News',
      score: raw.qualityScore || raw.quality_score || 7,
      quality_score: raw.qualityScore || raw.quality_score || 7,
      editorial_status: 'published',
      topics: raw.topics?.length ? raw.topics : [category],
      translations: {},
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      published_at: raw.publishedAt || raw.published_at || new Date().toISOString(),
      distributed: { telegram: false, facebook: false, whatsapp: false },
    }, 'slug');
    if (!ok) {
      const [existing] = await selectRows(env, 'articles', {
        filters: { slug },
        limit: 1,
        select: 'slug',
      });
      if (existing) {
        const now = new Date().toISOString();
        await patchRow(env, 'articles', 'slug', slug, { created_at: now, updated_at: now });
        await patchRawArticle(env, slug, { status: 'processed', editorial_status: 'published' });
        try {
          const [published] = await selectRows(env, 'articles', {
            filters: { slug },
            limit: 1,
            select: 'id,slug,title,summary,score,quality_score,image_url,category,source_url,source,language,distributed,telegram_posted_at',
          });
          if (published?.id) {
            const settings = await loadSiteSettings(env);
            await enqueueDistributionJobs(env, published, settings);
          }
        } catch { /* non-fatal */ }
        return 'published';
      }
      return 'failed';
    }
  } catch (err) {
    console.error(`Fast publish failed "${slug.slice(0, 40)}":`, err.message);
    return 'failed';
  }

  await patchRawArticle(env, slug, { status: 'processed', editorial_status: 'published' });

  try {
    const [published] = await selectRows(env, 'articles', {
      filters: { slug },
      limit: 1,
      select: 'id,slug,title,summary,score,quality_score,image_url,category,source_url,source,language,distributed,telegram_posted_at',
    });
    if (published?.id) {
      const settings = await loadSiteSettings(env);
      await enqueueDistributionJobs(env, published, settings);
    }
  } catch (enqueueErr) {
    console.error(`[fast-publish] enqueue jobs failed for ${slug}:`, enqueueErr.message);
  }

  return 'published';
}

export async function handleFastPublish(env, options = {}) {
  const L = getLimits(env);
  const batchSize = options.batchSize ?? L.PUBLISH_BATCH_SIZE;
  const maxRounds = options.maxRounds ?? L.PUBLISH_MAX_ROUNDS;
  const skipDistribution = options.skipDistribution === true;
  const skipImageResolve = options.skipImageResolve === true;
  const totals = { published: 0, failed: 0, skipped: 0, queue: 0, distributed: 0 };

  for (let round = 0; round < maxRounds; round++) {
    const pending = await fetchPending(env, 'pending_ai', batchSize);
    const classified = await fetchPending(env, 'classified', batchSize);
    const rejected = await fetchPending(env, 'rejected', batchSize);
    const processed = pending.length + classified.length + rejected.length < batchSize
      ? await fetchPending(env, 'processed', batchSize)
      : [];

    const queue = [...pending, ...classified, ...rejected, ...processed];
    if (!queue.length) break;

    totals.queue += queue.length;
    const publishedSlugs = [];

    for (const raw of queue) {
      const outcome = await publishOne(env, raw, { skipImageResolve });
      totals[outcome]++;
      if (outcome === 'published') publishedSlugs.push(raw.slug || raw.id);
    }

    if (!skipDistribution && publishedSlugs.length > 0) {
      try {
        const settings = await loadSiteSettings(env);
        const articles = await selectRows(env, 'articles', {
          filters: { editorial_status: 'published' },
          order: 'created_at',
          ascending: false,
          limit: publishedSlugs.length + 5,
        });

        const newArticles = articles.filter(a => publishedSlugs.includes(a.slug));
        for (const article of newArticles.slice(0, 1)) {
          try {
            await onArticlePublished(env, article, null, settings);
            await postToFacebook(env, article, settings);
            totals.distributed++;
          } catch (distErr) {
            console.error('[distribute] failed for', article.slug, distErr.message);
          }
        }
      } catch (err) {
        console.error('[distribute] batch failed:', err.message);
      }
    }

    if (queue.length < batchSize) break;
  }

  console.log('Fast publish complete:', totals);
  return totals;
}

/** Publish Malayalam raw articles only — resolves OG images, skips items without real thumbnails. */
export async function handlePublishMalayalam(env, options = {}) {
  const batchSize = options.batchSize ?? 8;
  const maxRounds = options.maxRounds ?? 3;
  const totals = { published: 0, failed: 0, skipped: 0, queue: 0, noImage: 0 };

  for (let round = 0; round < maxRounds; round++) {
    let queue = [];
    try {
      queue = await selectRows(env, 'raw_articles', {
        filters: { status: 'pending_ai', language: 'ml' },
        order: 'created_at',
        ascending: false,
        limit: batchSize,
      });
    } catch (err) {
      console.error('[publish-malayalam] fetch failed:', err.message);
      break;
    }

    if (!queue.length) break;
    totals.queue += queue.length;

    for (const raw of queue) {
      const outcome = await publishOne(env, raw, {
        skipImageResolve: false,
        requireRealImage: true,
      });
      if (outcome === 'published') totals.published++;
      else if (outcome === 'failed') totals.failed++;
      else {
        totals.skipped++;
        totals.noImage++;
      }
    }

    if (queue.length < batchSize) break;
  }

  console.log('[publish-malayalam] complete:', totals);
  return totals;
}

/** Re-queue processed Malayalam raw rows that never made it to articles (e.g. missing OG image). */
export async function requeueMalayalamRaw(env, { limit = 30 } = {}) {
  const base = (env.SUPABASE_URL || '').replace(/\/$/, '') + '/rest/v1';
  const h = supabaseHeaders(env);
  const res = await fetch(
    `${base}/raw_articles?language=eq.ml&status=eq.processed&order=created_at.desc&limit=${limit}&select=slug`,
    { headers: h },
  );
  if (!res.ok) return { requeued: 0, error: res.status };
  const rows = await res.json();
  let requeued = 0;
  for (const row of rows || []) {
    const slug = row.slug;
    if (!slug) continue;
    const art = await fetch(`${base}/articles?slug=eq.${encodeURIComponent(slug)}&language=eq.ml&select=slug,image_url&limit=1`, { headers: h });
    if (!art.ok) continue;
    const published = await art.json();
    if (published?.[0]?.slug && isRealArticleImage(published[0].image_url)) continue;
    const ok = await patchRawArticle(env, slug, { status: 'pending_ai', editorial_status: 'pending' });
    if (ok) requeued++;
  }
  return { requeued, scanned: (rows || []).length };
}

/** Drain pending raw_articles — light mode to stay within subrequest limits. */
export async function handleBacklogFlush(env, { maxRounds } = {}) {
  const L = getLimits(env);
  const rounds = [];
  let totalPublished = 0;
  const cap = maxRounds ?? L.BACKLOG_FLUSH_MAX_ROUNDS;

  for (let i = 0; i < cap; i++) {
    const result = await handleFastPublish(env, {
      batchSize: L.BACKLOG_BATCH_SIZE,
      maxRounds: 1,
      skipDistribution: true,
      skipImageResolve: true,
    });
    rounds.push(result);
    totalPublished += result.published || 0;
    if (!result.queue) break;
    if ((result.published || 0) === 0 && (result.failed || 0) === 0) break;
  }

  return { totalPublished, rounds: rounds.length, details: rounds };
}

/** Reset rejected/duplicate/classified/processed back to pending for re-processing */
export async function resetPipelineQueue(env) {
  let reset = 0;
  for (const status of ['rejected', 'duplicate', 'classified', 'processed']) {
    const docs = await runQuery(env, {
      from: [{ collectionId: 'raw_articles' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'status' },
          op: 'EQUAL',
          value: { stringValue: status },
        },
      },
      limit: 100,
    }, null);

    for (const doc of docs) {
      const slug = doc.slug || doc.id;
      const ok = await patchRawArticle(env, slug, {
        status: 'pending_ai',
        editorial_status: 'pending',
      });
      if (ok) reset++;
    }
  }
  return { reset };
}

/** Run ingest + fast publish in one call for maximum stories */
export async function handleBulkFill(env, { ingestHandler, rounds = 1 } = {}) {
  const summary = { rounds: [], totalPublished: 0 };

  for (let i = 0; i < rounds; i++) {
    const reset = await resetPipelineQueue(env);
    const ingested = ingestHandler ? await ingestHandler(env) : [];
    const published = await handleFastPublish(env);
    summary.rounds.push({
      round: i + 1,
      reset: reset.reset,
      ingested: Array.isArray(ingested) ? ingested.length : 0,
      ...published,
    });
    summary.totalPublished += published.published || 0;
  }

  return summary;
}
