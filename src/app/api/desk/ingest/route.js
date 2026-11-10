import { NextResponse } from 'next/server';
import { verifyDeskIngestRequest } from '@/lib/desk-ingest-auth';
import { createEditorialArticle, validateEditorialInput, logCoworkIngest } from '@/lib/editorial-articles';

export const dynamic = 'force-dynamic';

function asArticleList(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.articles)) return body.articles;
  if (body && typeof body === 'object') return [body];
  return [];
}

export async function POST(request) {
  const auth = verifyDeskIngestRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const items = asArticleList(body);
  if (!items.length) {
    return NextResponse.json({ error: 'Send one article object or an articles array.' }, { status: 400 });
  }
  if (items.length > 10) {
    return NextResponse.json({ error: 'Maximum 10 drafts per request.' }, { status: 400 });
  }

  const created = [];
  const errors = [];

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i] || {};
    const parsed = validateEditorialInput({
      ...item,
      author: item.author || 'Bharath News Desk',
      isAiAssisted: true,
      publishNow: false,
      scheduledAt: null,
    });
    if (parsed.error) {
      errors.push({ index: i, title: item.title || '', error: parsed.error });
      continue;
    }

    try {
      const article = await createEditorialArticle(
        { ...parsed.value, isAiAssisted: true, scheduledAt: null },
        auth,
        { publishNow: false, autoAssign: true },
      );
      created.push({
        id: article.id,
        title: article.title,
        slug: article.slug,
        editorialStatus: article.editorialStatus,
        language: article.language,
      });
    } catch (err) {
      const message = err.hint
        ? `${err.message || 'Could not save draft.'} ${err.hint}`
        : (err.message || 'Could not save draft.');
      errors.push({ index: i, title: item.title || '', error: message });
    }
  }

  // Log ingest activity (best-effort).
  logCoworkIngest({
    articleCount: created.length,
    errorCount: errors.length,
    source: 'cowork',
    details: { titles: created.map(a => a.title) },
  }).catch(() => {});

  if (!created.length) {
    return NextResponse.json(
      { error: 'No drafts were created.', errors },
      { status: 400 },
    );
  }

  const partial = errors.length > 0;
  return NextResponse.json({
    ok: true,
    partial,
    created: created.length,
    articles: created,
    errors,
    reviewUrl: '/desk/review',
  }, { status: partial ? 207 : 201 });
}
