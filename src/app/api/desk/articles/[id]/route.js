import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { capsAllow } from '@/lib/access-roles';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { readSiteSettings } from '@/lib/site-settings';
import {
  assignArticle,
  getEditorialArticle,
  reviewEditorialArticle,
  updateEditorialArticle,
  validateEditorialInput,
  validatePublishInput,
} from '@/lib/editorial-articles';
import { clearArticleRevisions, listArticleRevisions } from '@/lib/audit-log';

function isFullArticleWrite(body) {
  if (body.action === 'update') return true;
  if (body.action !== 'correct' || body.noteOnly === true) return false;
  return body.title !== undefined || body.fullContent !== undefined || body.full_content !== undefined;
}

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

export async function GET(request, { params }) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;
  try {
    const article = await getEditorialArticle(id);
    if (!article) return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    const revisions = await listArticleRevisions(id);
    return NextResponse.json({ article, revisions, role: auth.role });
  } catch (err) {
    return jsonError(err);
  }
}

export async function PATCH(request, { params }) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    if (isFullArticleWrite(body)) {
      const settings = await readSiteSettings(getSupabaseAdmin());
      const parsed = validateEditorialInput(body || {}, {
        languages: settings.newsroom.languages,
        defaultCategory: settings.newsroom.defaultCategory,
      });
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const correcting = body.action === 'correct';
      if (correcting && !capsAllow(auth.caps, 'correct')) {
        return NextResponse.json({ error: 'Corrections are limited to editors.' }, { status: 403 });
      }
      const article = await updateEditorialArticle(id, {
        ...parsed.value,
        correctionNote: body.correctionNote || body.notes || '',
      }, { actorId: auth.uid, allowPublished: correcting });
      return NextResponse.json({ article });
    }
    if (body.action === 'clear_revisions') {
      await clearArticleRevisions(id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'assign') {
      if (!capsAllow(auth.caps, 'assign')) {
        return NextResponse.json({ error: 'Assignment is limited to editors.' }, { status: 403 });
      }
      const article = await assignArticle(id, body.assignTo || null, { actorId: auth.uid });
      if (!article) return NextResponse.json({ error: 'Assignment columns not available. Run the migration.' }, { status: 500 });
      return NextResponse.json({ article });
    }
    if (['publish', 'needs_revision'].includes(body.action) && !capsAllow(auth.caps, 'publish')) {
      return NextResponse.json({ error: 'Publishing is limited to editors.' }, { status: 403 });
    }
    if ((body.action === 'unpublish' || body.action === 'correct') && !capsAllow(auth.caps, 'correct')) {
      return NextResponse.json({ error: body.action === 'unpublish' ? 'Unpublishing is limited to editors.' : 'Corrections are limited to editors.' }, { status: 403 });
    }
    let publishing = null;
    if (body.action === 'publish') {
      const checked = validatePublishInput(body);
      if (checked.error) return NextResponse.json({ error: checked.error }, { status: 400 });
      publishing = checked.value;
    }
    const article = await reviewEditorialArticle(id, {
      action: body.action,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 1000) : '',
      correctionNote: typeof body.correctionNote === 'string' ? body.correctionNote : '',
      publishing,
      actorId: auth.uid,
    });
    return NextResponse.json({ article });
  } catch (err) {
    return jsonError(err);
  }
}
