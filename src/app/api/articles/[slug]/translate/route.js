import { NextResponse } from 'next/server';
import {
  getArticleBySlugAdmin,
  saveArticleTranslation,
} from '@/lib/supabase-admin';
import { getStoredTranslation } from '@/lib/article-translations';
import { detectPublicationLang, translationMatchesTarget } from '../../../../../../shared/publication-lang.mjs';

const WORKER_URL = (process.env.NEXT_PUBLIC_WORKER_URL || '').replace(/\/$/, '');
const ALLOWED = new Set(['en', 'ml']);

export async function POST(request, { params }) {
  const { slug } = await params;
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'Invalid article.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const targetLang = typeof body.targetLang === 'string' ? body.targetLang.trim().toLowerCase() : '';
  if (!ALLOWED.has(targetLang)) {
    return NextResponse.json({ error: 'Unsupported target language.' }, { status: 400 });
  }

  try {
    let article;
    try {
      article = await getArticleBySlugAdmin(slug);
    } catch (adminErr) {
      return NextResponse.json(
        { error: 'Translation service is temporarily unavailable. Please try again later.' },
        { status: 503 },
      );
    }
    if (!article) {
      return NextResponse.json({ error: 'Article not found.' }, { status: 404 });
    }

    const declared = String(article.language || 'en').trim().toLowerCase();
    const detected = detectPublicationLang(`${article.title || ''}\n${article.summary || ''}\n${article.fullContent || ''}`);
    const sourceLang = detected || declared;
    if (!ALLOWED.has(sourceLang)) {
      return NextResponse.json({ error: 'Unsupported source language.' }, { status: 400 });
    }
    if (targetLang === sourceLang) {
      return NextResponse.json({
        translation: {
          title: article.title,
          summary: article.summary,
          fullContent: article.fullContent,
          machineAssisted: false,
        },
      });
    }

    const existing = getStoredTranslation(article, targetLang);
    const forceRetranslate = body.forceRetranslate === true;
    const cacheValid = existing?.provider === 'google-nmt' && (existing?.fullContent || existing?.title);
    if (!forceRetranslate && cacheValid) {
      return NextResponse.json({ translation: existing });
    }

    if (!WORKER_URL) {
      return NextResponse.json({ error: 'Translation service unavailable.' }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.thebharathnews.com';
    const workerRes = await fetch(`${WORKER_URL}/api/article-translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: siteUrl,
      },
      body: JSON.stringify({
        title: article.title,
        summary: article.summary,
        fullContent: article.fullContent,
        targetLang,
        sourceLang,
      }),
    });

    const workerData = await workerRes.json().catch(() => ({}));
    if (!workerRes.ok) {
      return NextResponse.json(
        { error: workerData.error || 'Translation failed.' },
        { status: workerRes.status },
      );
    }

    const translation = {
      ...workerData.translation,
      machineAssisted: true,
      provider: workerData.translation?.provider || 'google-nmt',
    };
    if (!translationMatchesTarget(translation.title, translation.fullContent, targetLang)) {
      return NextResponse.json(
        { error: 'Translation did not come back in the requested language.' },
        { status: 502 },
      );
    }

    if (article.id) {
      await saveArticleTranslation(article.id, targetLang, translation).catch(() => {});
    }

    return NextResponse.json({ translation });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Translation failed.' }, { status: 500 });
  }
}
