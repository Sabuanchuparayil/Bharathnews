import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { capsAllow } from '@/lib/access-roles';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { readSiteSettings } from '@/lib/site-settings';
import {
  createEditorialArticle,
  editorialStats,
  fillReviewEnglish,
  listEditorialArticles,
  publishDueDrafts,
  validateEditorialInput,
  validatePublishInput,
} from '@/lib/editorial-articles';

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

export async function GET(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'queue';

  try {
    if (view === 'stats') {
      const stats = await editorialStats();
      return NextResponse.json(stats);
    }
    const settings = await readSiteSettings(getSupabaseAdmin());
    const pageSize = settings.newsroom.reviewPageSize;
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);
    const status = view === 'mine' ? 'all' : (searchParams.get('status') || 'queue');
    const listed = await listEditorialArticles({
      status: view === 'mine' ? 'all' : status,
      mine: view === 'mine' ? auth.uid : null,
      assignedTo: view === 'assigned' ? auth.uid : null,
      unassigned: view === 'unassigned',
      limit: pageSize,
      offset,
    });
    const articles = status === 'published' || status === 'rejected'
      ? listed
      : await fillReviewEnglish(listed);
    return NextResponse.json({ articles, hasMore: articles.length === pageSize, offset, role: auth.role });
  } catch (err) {
    return jsonError(err);
  }
}

export async function POST(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (body.action === 'publish_due') {
    if (!capsAllow(auth.caps, 'publish')) {
      return NextResponse.json({ error: 'Publishing is limited to editors.' }, { status: 403 });
    }
    try {
      const { published, skipped } = await publishDueDrafts();
      return NextResponse.json({ articles: published, skipped });
    } catch (err) {
      return jsonError(err);
    }
  }

  const settings = await readSiteSettings(getSupabaseAdmin());
  const parsed = validateEditorialInput(body || {}, {
    languages: settings.newsroom.languages,
    defaultCategory: settings.newsroom.defaultCategory,
  });
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const publishNow = body.publishNow === true;
  if (publishNow && !capsAllow(auth.caps, 'publish')) {
    return NextResponse.json({ error: 'Publishing is limited to editors.' }, { status: 403 });
  }
  let publishing = null;
  if (publishNow) {
    const checked = validatePublishInput(body);
    if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });
    publishing = checked.value;
  }

  try {
    const article = await createEditorialArticle(parsed.value, auth, { publishNow, publishing });
    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
