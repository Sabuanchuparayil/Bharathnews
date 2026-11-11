import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import {
  createEditorialArticle,
  editorialStats,
  listEditorialArticles,
  publishDueDrafts,
  validateEditorialInput,
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
    const status = view === 'mine' ? 'all' : (searchParams.get('status') || 'queue');
    const articles = await listEditorialArticles({
      status: view === 'mine' ? 'all' : status,
      mine: view === 'mine' ? auth.uid : null,
      assignedTo: view === 'assigned' ? auth.uid : null,
      unassigned: view === 'unassigned',
    });
    return NextResponse.json({ articles, role: auth.role });
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
    try {
      const articles = await publishDueDrafts();
      return NextResponse.json({ articles });
    } catch (err) {
      return jsonError(err);
    }
  }

  const parsed = validateEditorialInput(body || {});
  if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const publishNow = body.publishNow === true;
  if (publishNow && !auth.caps?.includes('admin')) {
    return NextResponse.json({ error: 'Only an editor-in-chief can publish without review.' }, { status: 403 });
  }

  try {
    const article = await createEditorialArticle(parsed.value, auth, { publishNow });
    return NextResponse.json({ article }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
