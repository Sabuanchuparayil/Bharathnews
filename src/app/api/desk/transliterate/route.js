import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';

export const maxDuration = 10;

const cache = new Map();
const CACHE_MS = 24 * 60 * 60 * 1000;

function cachedWords(text) {
  const hit = cache.get(text);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_MS) {
    cache.delete(text);
    return null;
  }
  return hit.words;
}

function storeWords(text, words) {
  if (!words.length) return;
  if (cache.size > 400) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(text, { at: Date.now(), words });
}

function malayalamWords(payload) {
  if (!Array.isArray(payload) || payload[0] !== 'SUCCESS') return [];
  const row = payload[1]?.[0];
  const candidates = Array.isArray(row?.[1]) ? row[1] : [];
  const seen = new Set();
  const words = [];
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || !/[\u0D00-\u0D7F]/.test(candidate)) continue;
    const key = candidate.replace(/[\u200C\u200D]/g, '');
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(candidate);
    if (words.length === 5) break;
  }
  return words;
}

export async function GET(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const text = (new URL(request.url).searchParams.get('text') || '').trim().toLowerCase().slice(0, 40);
  if (!/^[a-z]+$/.test(text) || text.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }
  const stored = cachedWords(text);
  if (stored) return NextResponse.json({ suggestions: stored });

  const url = new URL('https://inputtools.google.com/request');
  url.searchParams.set('text', text);
  url.searchParams.set('itc', 'ml-t-i0-und');
  url.searchParams.set('num', '8');
  url.searchParams.set('cp', '0');
  url.searchParams.set('cs', '1');
  url.searchParams.set('ie', 'utf-8');
  url.searchParams.set('oe', 'utf-8');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/2.0 (editorial Malayalam typing; https://www.thebharathnews.com)' },
      signal: controller.signal,
    });
    if (!res.ok) return NextResponse.json({ suggestions: [] });
    const words = malayalamWords(await res.json());
    storeWords(text, words);
    return NextResponse.json({ suggestions: words });
  } catch {
    return NextResponse.json({ suggestions: [] });
  } finally {
    clearTimeout(timer);
  }
}
