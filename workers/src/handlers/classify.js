import { classifyArticle } from '../lib/claude.js';
import { runQuery, patchRawArticle } from '../lib/supabase-rest.js';
import { loadSiteSettings } from '../lib/sources-loader.js';

const BATCH_SIZE = 15;

export async function handleClassify(env) {
  const settings = await loadSiteSettings(env);
  const threshold = settings.qualityThreshold || 6;
  const results = { classified: 0, rejected: 0, duplicate: 0 };

  const docs = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'pending_ai' },
      },
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'ASCENDING' }],
    limit: BATCH_SIZE,
  }, null);

  console.log(`Classify: found ${docs.length} pending articles`);

  for (const raw of docs) {
    try {
      const outcome = await classifyOne(env, raw, threshold);
      results[outcome]++;
    } catch (err) {
      console.error(`Classify error for "${raw.title?.slice(0, 40)}":`, err.message);
    }
  }

  console.log(`Classify complete:`, results);
  return results;
}

async function classifyOne(env, raw, threshold) {
  const slug = raw.slug || raw.id;

  const classification = await classifyArticle(env, {
    title: raw.title,
    description: raw.description,
    source: raw.source,
    category: raw.category,
    language: raw.language,
  });

  const qualityScore = classification.qualityScore ?? 7;
  const isJunk = classification.isJunk === true;
  const relevance = classification.relevanceToAudience ?? qualityScore;

  if (isJunk || qualityScore < threshold || relevance < 3) {
    await patchRawArticle(env, slug, {
      status: 'rejected',
      editorial_status: 'rejected',
      quality_score: qualityScore,
      topics: classification.topics || [],
      detected_language: classification.detectedLanguage || raw.language || 'en',
      category: classification.category || raw.category,
      cluster_id: classification.dedupKey || '',
      reject_reason: (classification.reasons || 'Below quality threshold').slice(0, 500),
    });
    return 'rejected';
  }

  const duplicate = await checkDuplicate(env, classification.dedupKey);
  if (duplicate) {
    await patchRawArticle(env, slug, {
      status: 'duplicate',
      editorial_status: 'duplicate',
      quality_score: qualityScore,
      cluster_id: classification.dedupKey || '',
      topics: classification.topics || [],
      detected_language: raw.language || classification.detectedLanguage || 'en',
      category: classification.category || raw.category,
    });
    return 'duplicate';
  }

  await patchRawArticle(env, slug, {
    status: 'classified',
    editorial_status: 'classified',
    quality_score: qualityScore,
    category: classification.category || raw.category,
    topics: classification.topics || [],
    detected_language: raw.language || classification.detectedLanguage || 'en',
    cluster_id: classification.dedupKey || '',
    language: raw.language || classification.detectedLanguage || 'en',
  });

  return 'classified';
}

async function checkDuplicate(env, dedupKey) {
  if (!dedupKey) return false;
  const existing = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'clusterId' },
        op: 'EQUAL',
        value: { stringValue: dedupKey },
      },
    },
    limit: 5,
  }, null);
  return existing.some(e => ['classified', 'processed'].includes(e.status));
}
