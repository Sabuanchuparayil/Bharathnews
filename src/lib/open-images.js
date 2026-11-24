/** Openly licensed photos from Openverse. No API key. Results are sized for a news card. */

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'in', 'for', 'on', 'with', 'from', 'after', 'over', 'new', 'its', 'that', 'this']);
const LICENSE_LABEL = { cc0: 'CC0', pdm: 'Public domain', by: 'CC BY', 'by-sa': 'CC BY-SA' };
const SCRIPT_LANG = [
  [/[\u0D00-\u0D7F]/, 'ml'],
  [/[\u0B80-\u0BFF]/, 'ta'],
  [/[\u0C00-\u0C7F]/, 'te'],
  [/[\u0C80-\u0CFF]/, 'kn'],
  [/[\u0980-\u09FF]/, 'bn'],
  [/[\u0900-\u097F]/, 'hi'],
  [/[\u0600-\u06FF]/, 'ar'],
];

function latinQuery(title) {
  const words = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
    .slice(0, 4);
  return words.length >= 2 ? words.join(' ') : '';
}

function sourceLang(title) {
  const text = String(title || '');
  for (const [pattern, code] of SCRIPT_LANG) {
    if (pattern.test(text)) return code;
  }
  return '';
}

async function englishQuery(title, timeoutMs) {
  const direct = latinQuery(title);
  if (direct) return direct;
  const lang = sourceLang(title);
  const raw = String(title || '').trim().slice(0, 180);
  if (!lang || !raw) return '';

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(raw)}&langpair=${lang}|en`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/2.0 (editorial image search; https://www.thebharathnews.com)' },
      signal: controller.signal,
    });
    if (!res.ok) return '';
    const json = await res.json();
    const translated = String(json.responseData?.translatedText || '');
    if (!translated || json.quotaFinished || /MYMEMORY WARNING/i.test(translated)) return '';
    return latinQuery(translated);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

function sizedUrl(url, width) {
  if (!url) return '';
  const wiki = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/i);
  if (wiki && !url.includes('/thumb/')) {
    return `${wiki[1]}/thumb/${wiki[2]}/${wiki[3]}/${wiki[4]}/1200px-${wiki[4]}`;
  }
  if (url.includes('live.staticflickr.com') && Number(width) > 1400) {
    return url.replace(/(_o|_k|_h|_3k)?\.(jpg|jpeg)$/i, '_b.$2');
  }
  return url;
}

function creditFor(photo) {
  const license = LICENSE_LABEL[photo.license] || 'open licence';
  const creator = String(photo.creator || '').trim();
  const line = creator ? `Photo by ${creator} (${license}) via Openverse` : `${license} via Openverse`;
  return line.slice(0, 160);
}

async function requestOpenverse(q, page, pageSize, wide, timeoutMs = 8000) {
  const url = new URL('https://api.openverse.org/v1/images/');
  url.searchParams.set('q', q);
  url.searchParams.set('page_size', String(Math.min(Math.max(pageSize, 1), 20)));
  url.searchParams.set('page', String(Math.max(page, 1)));
  url.searchParams.set('mature', 'false');
  url.searchParams.set('license', 'cc0,pdm,by,by-sa');
  url.searchParams.set('category', 'photograph');
  if (wide) url.searchParams.set('aspect_ratio', 'wide');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/2.0 (editorial image search; https://www.thebharathnews.com)' },
      signal: controller.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.results || []).map(photo => {
      if (photo.width && Number(photo.width) < 600) return null;
      const full = sizedUrl(photo.url, photo.width);
      if (!full.startsWith('https://')) return null;
      return {
        url: full,
        thumb: photo.thumbnail || full,
        label: photo.title || 'Open photo',
        credit: creditFor(photo),
      };
    }).filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function collectImages(q, page, pageSize, timeoutMs) {
  const started = Date.now();
  const wide = await requestOpenverse(q, page, pageSize, true, timeoutMs);
  if (wide.length) return wide;
  const left = timeoutMs - (Date.now() - started);
  if (left < 700) return [];
  return requestOpenverse(q, page, pageSize, false, left);
}

export async function searchOpenImages({ query = '', page = 1, pageSize = 8 } = {}) {
  const started = Date.now();
  const budget = 4000;
  let q = String(query || '').trim().slice(0, 180);
  if (!q) return [];
  if (!latinQuery(q)) {
    const english = await englishQuery(q, 800);
    if (english) q = english;
  }
  q = q.slice(0, 80);
  const found = await collectImages(q, page, pageSize, Math.max(700, budget - (Date.now() - started)));
  if (found.length || page > 1) return found;
  const shorter = q.split(/\s+/).slice(0, 2).join(' ');
  if (!shorter || shorter === q) return found;
  const left = budget - (Date.now() - started);
  if (left < 700) return found;
  return collectImages(shorter, 1, pageSize, left);
}

export async function findOpenImage({ title, category, timeoutMs = 8000, fallback = true } = {}) {
  const started = Date.now();
  const translateCap = Math.min(800, Math.max(400, Math.floor(timeoutMs * 0.35)));
  const query = await englishQuery(title, translateCap);
  const searchMs = Math.max(1000, timeoutMs - (Date.now() - started));
  const primary = (query || String(category || '').trim() || 'news').split(/\s+/).filter(Boolean).slice(0, 2).join(' ');
  const first = await requestOpenverse(primary, 1, 4, true, searchMs);
  if (first[0] || !fallback) return first[0] || null;
  const topic = String(category || '').trim();
  if (!topic || topic === primary) return null;
  const left = timeoutMs - (Date.now() - started);
  if (left < 700) return null;
  const second = await requestOpenverse(topic, 1, 4, false, left);
  return second[0] || null;
}
