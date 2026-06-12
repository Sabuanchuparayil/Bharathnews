import { generateMultilingualArticle } from '../lib/llama.js';
import { resolveArticleImage, isCategoryFallbackImage } from '../lib/image-resolver.js';
import { getFirebaseToken } from '../lib/firebase-auth.js';
import { runQuery, FIRESTORE_BASE } from '../lib/firestore-rest.js';
import { loadSiteSettings } from '../lib/sources-loader.js';

// Each article costs ~6 subrequests (status, image, AI gen, publish, status, telegram);
// kept low for the 50-subrequest free-tier limit per invocation.
const BATCH_SIZE = 5;

export async function handleAIProcess(env) {
  const token = await getFirebaseToken(env);
  const settings = await loadSiteSettings(env);
  const targetLangs = Array.isArray(settings.targetLanguages)
    ? settings.targetLanguages
    : (settings.targetLanguages || 'ml,hi,ar').split(',').map(s => s.trim());
  const processed = [];

  // Recover articles stuck in "processing" from previous failed runs
  const stuck = await runQuery(env, {
    from: [{ collectionId: 'raw_articles' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'status' },
        op: 'EQUAL',
        value: { stringValue: 'processing' },
      },
    },
      limit: 5,
  }, token);
  for (const doc of stuck) {
    const slug = doc.slug || doc.id;
    const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles/${slug}`;
    await patchStatus(docPath, token, 'classified').catch(() => {});
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
    limit: BATCH_SIZE,
  }, token);

  console.log(`AI process: found ${docs.length} classified articles`);

  for (const raw of docs) {
    try {
      const result = await processOneArticle(env, raw, token, targetLangs, settings);
      if (result) processed.push(result);
    } catch (err) {
      console.error('AI process error:', err.message);
      const slug = raw.slug || raw.id;
      const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles/${slug}`;
      await patchStatus(docPath, token, 'classified').catch(() => {});
    }
  }

  console.log(`AI process complete: ${processed.length} articles published`);
  return { processed: processed.length, remaining: Math.max(0, docs.length - processed.length) };
}

async function processOneArticle(env, raw, token, targetLangs, settings) {
  const slug = raw.slug || raw.id;
  const docPath = `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/raw_articles/${slug}`;

  await patchStatus(docPath, token, 'processing');

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
  const language = raw.detectedLanguage || raw.language || 'en';

  let parsed;
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

  const translationFields = buildTranslationFields(parsed.translations || {});

  const finalTitle = parsed.title || title || slug.replace(/-/g, ' ');
  if (!finalTitle.trim()) {
    console.error(`Skipping article with no title: ${slug}`);
    await patchStatus(docPath, token, 'rejected');
    return null;
  }

  const publishRes = await fetch(`${FIRESTORE_BASE(env.FIREBASE_PROJECT_ID)}/articles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        title: { stringValue: finalTitle },
        slug: { stringValue: slug },
        summary: { stringValue: parsed.summary || '' },
        fullContent: { stringValue: parsed.fullContent || '' },
        translations: translationFields,
        imageUrl: { stringValue: imageUrl },
        category: { stringValue: category },
        region: { stringValue: region },
        language: { stringValue: language },
        source: { stringValue: source },
        author: { stringValue: 'The Bharath News' },
        qualityScore: { doubleValue: qualityScore },
        score: { integerValue: String(parsed.score || qualityScore) },
        editorialStatus: { stringValue: 'published' },
        clusterId: { stringValue: raw.clusterId || '' },
        views: { integerValue: '0' },
        likes: { integerValue: '0' },
        comments: { integerValue: '0' },
        shares: { integerValue: '0' },
        topics: { arrayValue: { values: (parsed.topics || topics).map(t => ({ stringValue: t })) } },
        publishedAt: { timestampValue: new Date().toISOString() },
        distributed: { mapValue: { fields: {
          telegram: { booleanValue: false },
          facebook: { booleanValue: false },
          whatsapp: { booleanValue: false },
        }}},
      },
    }),
  });

  if (!publishRes.ok) {
    const err = await publishRes.text();
    console.error(`Failed to publish "${title.slice(0, 40)}":`, err.slice(0, 200));
    await patchStatus(docPath, token, 'classified');
    return null;
  }

  await patchStatus(docPath, token, 'processed');

  if ((parsed.score || qualityScore) >= 7 && env.TELEGRAM_BOT_TOKEN) {
    await distributeToTelegram(env, {
      title: parsed.title || title,
      summary: parsed.summary,
      slug,
      category,
    });
  }

  return parsed.title || title;
}

function buildTranslationFields(translations) {
  const langFields = {};
  for (const [lang, content] of Object.entries(translations)) {
    if (!content) continue;
    langFields[lang] = {
      mapValue: {
        fields: {
          title: { stringValue: content.title || '' },
          summary: { stringValue: content.summary || '' },
          fullContent: { stringValue: content.fullContent || '' },
        },
      },
    };
  }
  return { mapValue: { fields: langFields } };
}

async function patchStatus(docPath, token, status) {
  await fetch(`https://firestore.googleapis.com/v1/${docPath}?updateMask.fieldPaths=status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { status: { stringValue: status } } }),
  });
}

async function distributeToTelegram(env, article) {
  try {
    const msg = `<b>${escapeHtml(article.title)}</b>\n\n${escapeHtml(article.summary)}\n\n📰 <a href="https://thebharathnews.com/article/${article.slug}">Read Full Story</a>\n\n#${article.category} #TheBharathNews`;
    await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHANNEL_ID, text: msg, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('Telegram failed:', err.message);
  }
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
