import { NextResponse } from 'next/server';
import { verifyAdminRequest, getAdminApp } from '@/lib/firebase-admin-server';
import { getFirestore } from 'firebase-admin/firestore';
import { onArticlePublished } from '@/lib/on-article-published';

export async function POST(request) {
  const auth = await verifyAdminRequest(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const articleId = typeof body.articleId === 'string' ? body.articleId.trim() : '';
  if (!articleId) {
    return NextResponse.json({ error: 'articleId required.' }, { status: 400 });
  }

  try {
    const db = getFirestore(getAdminApp());
    const snap = await db.collection('articles').doc(articleId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const article = { id: snap.id, ...snap.data() };
    await onArticlePublished(article);

    return NextResponse.json({ ok: true, telegramPostedAt: article.telegramPostedAt || 'attempted' });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Notify failed.' }, { status: 500 });
  }
}
