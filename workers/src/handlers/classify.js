import { classifyArticle } from '../lib/claude.js';
import { getFirebaseToken } from '../lib/firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from '../lib/firestore-rest.js';
import { loadSiteSettings } from '../lib/sources-loader.js';

const BATCH_SIZE = 5;

export async function handleClassify(env) {
  const token = await getFirebaseToken(env);
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
    limit: BATCH_SIZE,
  }, token);

  console.log(`Classify: found ${docs.length} pending articles`);

  for (const raw of docs) {
    try {
      const outcome = await classifyOne(env, raw, token, threshold);
      results[outcome]++;
    } catch (err) {
      console.error(`Classify error for "${raw.title?.slice(0, 40)}":`, err.message);
    }
  }

  console.log(`Classify complete:`, results);
  return results;
}

async function classifyOne(env, raw, token, threshold) {
  const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles/${raw.slug || raw.id}`;

  const classification = await classifyArticle(env, {
    title: raw.title,
    description: raw.description,
    source: raw.source,
    category: raw.category,
    language: raw.language,
  });

  const qualityScore = classification.qualityScore ?? 5;
  const isJunk = classification.isJunk === true;
  const relevance = classification.relevanceToAudience ?? qualityScore;

  if (isJunk || qualityScore < threshold || relevance < threshold) {
    await patchRaw(docPath, token, {
      status: 'rejected',
      editorialStatus: 'rejected',
      qualityScore,
      topics: classification.topics || [],
      detectedLanguage: classification.detectedLanguage || raw.language || 'en',
      category: classification.category || raw.category,
      clusterId: classification.dedupKey || '',
      rejectReason: classification.reasons || 'Below quality threshold',
    });
    return 'rejected';
  }

  const duplicate = await checkDuplicate(env, classification.dedupKey, token);
  if (duplicate) {
    await patchRaw(docPath, token, {
      status: 'duplicate',
      editorialStatus: 'duplicate',
      qualityScore,
      clusterId: classification.dedupKey || '',
      topics: classification.topics || [],
      detectedLanguage: classification.detectedLanguage || raw.language || 'en',
      category: classification.category || raw.category,
    });
    return 'duplicate';
  }

  await patchRaw(docPath, token, {
    status: 'classified',
    editorialStatus: 'classified',
    qualityScore,
    category: classification.category || raw.category,
    topics: classification.topics || [],
    detectedLanguage: classification.detectedLanguage || raw.language || 'en',
    clusterId: classification.dedupKey || '',
    dedupKey: classification.dedupKey || '',
    language: classification.detectedLanguage || raw.language || 'en',
  });

  return 'classified';
}

async function checkDuplicate(env, dedupKey, token) {
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
  }, token);
  return existing.some(e => ['classified', 'processed'].includes(e.status));
}

async function patchRaw(docPath, token, data) {
  const fields = {};
  const mask = [];

  for (const [key, val] of Object.entries(data)) {
    mask.push(`updateMask.fieldPaths=${key}`);
    if (typeof val === 'string') fields[key] = { stringValue: val };
    else if (typeof val === 'number') fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (Array.isArray(val)) fields[key] = { arrayValue: { values: val.map(v => ({ stringValue: String(v) })) } };
  }

  await fetch(`https://firestore.googleapis.com/v1/${docPath}?${mask.join('&')}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  });
}
