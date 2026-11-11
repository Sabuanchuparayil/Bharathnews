import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import {
  assignArticle,
  getEditorialArticle,
  reviewEditorialArticle,
  updateEditorialArticle,
  validateEditorialInput,
} from '@/lib/editorial-articles';

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
    return NextResponse.json({ article, role: auth.role });
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
    if (body.action === 'update') {
      const parsed = validateEditorialInput(body || {});
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const article = await updateEditorialArticle(id, parsed.value);
      return NextResponse.json({ article });
    }
    if (body.action === 'assign') {
      if (!auth.caps?.includes('admin')) {
        return NextResponse.json({ error: 'Only an admin can assign drafts.' }, { status: 403 });
      }
      const article = await assignArticle(id, body.assignTo || null);
      if (!article) return NextResponse.json({ error: 'Assignment columns not available. Run the migration.' }, { status: 500 });
      return NextResponse.json({ article });
    }
    const article = await reviewEditorialArticle(id, {
      action: body.action,
      notes: typeof body.notes === 'string' ? body.notes.slice(0, 1000) : '',
    });
    return NextResponse.json({ article });
  } catch (err) {
    return jsonError(err);
  }
}
