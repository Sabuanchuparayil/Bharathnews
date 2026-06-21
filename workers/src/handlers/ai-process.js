import { generateMultilingualArticle } from '../lib/llama.js';
import { resolveArticleImage, isCategoryFallbackImage } from '../lib/image-resolver.js';
import { runQuery, insertRow, patchRawArticle } from '../lib/supabase-rest.js';
import { loadSiteSettings } from '../lib/sources-loader.js';
import { onArticlePublished } from '../lib/on-article-published.js';

const BATCH_SIZE = 8;

export async function handleAIProcess(env) {
  const settings = await loadSiteSettings(env);
  const targetLangs = Array.isArray(settings.targetLanguages)
    ? settings.targetLanguages
    : (settings.targetLanguages || 'ml,hi,ar').split(',').map(s => s.trim());
  const processed = [];

  const stuck = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'processing' },
      },
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
    limit: 5,
  }, null);

  for (const doc of stuck) {
    await patchRawArticle(env, doc.slug || doc.id, { status: 'classified' }).catch(() => {});
  }
  if (stuck.length) console.log(`Recovered ${stuck.length} stuck processing articles`);

  const docs = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'classified' },
      },
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
    limit: BATCH_SIZE,
  }, null);

  console.log(`AI process: found ${docs.length} classified articles`);

  for (const raw of docs) {
    try {
      const result = await processOneArticle(env, raw, targetLangs, settings);
      if (result) processed.push(result);
    } catch (err) {
      console.error('AI process error:', err.message);
      const slug = raw.slug || raw.id;
      await patchRawArticle(env, slug, { status: 'classified' }).catch(() => {});
    }
  }

  console.log(`AI process complete: ${processed.length} articles published`);
  return { processed: processed.length, remaining: Math.max(0, docs.length - processed.length) };
}

async function processOneArticle(env, raw, targetLangs, settings) {
  const slug = raw.slug || raw.id;

  await patchRawArticle(env, slug, { status: 'processing' });

  const title = raw.title || '';
  const description = raw.description || '';
  const source = raw.source || '';
  const category = raw.category || 'india';
  const region = raw.region || 'india';
  const imageUrl = (!raw.imageUrl || isCategoryFallbackImage(raw.imageUrl))
    ? await resolveArticleImage({
        imageUrl: '',
        sourceUrl: raw.sourceUrl || raw.link || '',
        category,
      })
    : raw.imageUrl;
  const topics = raw.topics || [category];
  const qualityScore = raw.qualityScore || 6;
  const language = raw.language || raw.detectedLanguage || 'en';
  const isNative = language !== 'en';

  let parsed;
  if (isNative) {
    parsed = {
      title,
      summary: description.slice(0, 300) || title,
      fullContent: description || title,
      topics,
      score: qualityScore,
      translations: {},
    };
  } else {
    try {
      parsed = await generateMultilingualArticle(env, {
        title, description, source, category, topics, targetLangs,
      });
    } catch (err) {
      console.error(`Generation failed for "${title.slice(0, 40)}":`, err.message);
      parsed = {
        title,
        summary: description.slice(0, 200) || title,
        fullContent: description || title,
        topics,
        score: qualityScore,
        translations: {},
      };
    }
  }

  const translations = parsed.translations || {};
  const finalTitle = parsed.title || title || slug.replace(/-/g, ' ');
  if (!finalTitle.trim()) {
    console.error(`Skipping article with no title: ${slug}`);
    await patchRawArticle(env, slug, { status: 'rejected' });
    return null;
  }

  let articleRow;
  try {
    articleRow = await insertRow(env, 'articles', {
      title: finalTitle,
      slug,
      summary: parsed.summary || '',
      full_content: parsed.fullContent || '',
      translations,
      image_url: imageUrl,
      category,
      subcategory: raw.subcategory || null,
      region,
      language,
      source,
      author: 'The Bharath News',
      quality_score: qualityScore,
      score: parsed.score || qualityScore,
      editorial_status: 'published',
      cluster_id: raw.clusterId || '',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      topics: parsed.topics || topics,
      published_at: new Date().toISOString(),
      distributed: { telegram: false, facebook: false, whatsapp: false },
    });
  } catch (err) {
    console.error(`Failed to publish "${title.slice(0, 40)}":`, err.message);
    await patchRawArticle(env, slug, { status: 'classified' });
    return null;
  }

  await patchRawArticle(env, slug, { status: 'processed' });

  const articleId = articleRow?.id;
  if (articleId) {
    await onArticlePublished(env, {
      id: articleId,
      title: finalTitle,
      slug,
      summary: parsed.summary || '',
      editorialStatus: 'published',
      score: parsed.score || qualityScore,
      qualityScore,
    }, null, settings);
  }

  return parsed.title || title;
}
