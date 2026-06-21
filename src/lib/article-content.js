/** Client/server helpers to extract full article text from publisher pages. */

const MIN_USEFUL_BODY = 400;
const MAX_BODY = 15000;

function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function stripArticleHtml(html) {
  return (html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

export function normalizeArticleBody(text) {
  if (!text) return '';
  return stripArticleHtml(decodeHtmlEntities(text))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_BODY);
}

function scoreParagraph(text) {
  const t = text.trim();
  if (t.length < 40) return -1;
  if (/^(share|follow|read also|related|advertisement|subscribe)/i.test(t)) return -1;
  return t.length;
}

function extractParagraphsFromScope(scope) {
  const chunks = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(scope)) !== null) {
    const text = normalizeArticleBody(m[1]);
    if (scoreParagraph(text) >= 40) chunks.push(text);
  }
  return chunks.join('\n\n').slice(0, MAX_BODY);
}

function extractFromJsonLd(html) {
  const scripts = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  for (const block of scripts) {
    try {
      const json = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''));
      const nodes = Array.isArray(json) ? json : [json];
      for (const node of nodes) {
        const body = node?.articleBody || node?.description;
        if (typeof body === 'string' && body.length >= MIN_USEFUL_BODY) {
          return normalizeArticleBody(body);
        }
      }
    } catch { /* ignore */ }
  }
  return '';
}

function extractFromContentDiv(html) {
  const markers = [
    'entry-content',
    'post-content',
    'article-content',
    'td-post-content',
    'story-content',
    'itemprop="articleBody"',
  ];
  for (const marker of markers) {
    const idx = html.indexOf(marker);
    if (idx === -1) continue;
    const text = extractParagraphsFromScope(html.slice(idx, idx + 60000));
    if (text.length >= MIN_USEFUL_BODY) return text;
  }
  return '';
}

export function extractParagraphsFromHtml(html) {
  const jsonLd = extractFromJsonLd(html);
  if (jsonLd.length >= MIN_USEFUL_BODY) return jsonLd;

  const fromDiv = extractFromContentDiv(html);
  if (fromDiv.length >= MIN_USEFUL_BODY) return fromDiv;

  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  const scope = articleMatch ? articleMatch[0] : html.slice(0, 250000);
  const fromArticle = extractParagraphsFromScope(scope);
  if (fromArticle.length >= MIN_USEFUL_BODY) return fromArticle;

  const ogDesc =
    html.match(/property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
    html.match(/content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  if (ogDesc?.[1]) {
    const og = normalizeArticleBody(ogDesc[1]);
    if (og.length >= MIN_USEFUL_BODY) return og;
  }

  return fromArticle;
}

export async function fetchArticleBodyFromUrl(url, timeoutMs = 5000) {
  if (!url?.startsWith('http')) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheBharathNews/2.0)' },
      signal: controller.signal,
      redirect: 'follow',
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = await res.text();
    return extractParagraphsFromHtml(html);
  } catch {
    return '';
  }
}

export function isExcerptOnly(content, summary = '') {
  if (!content) return true;
  const text = content.trim();
  if (text.length < 800) return true;
  if (summary && text === summary.trim()) return true;
  if (summary && text.length <= summary.trim().length + 80) return true;
  return false;
}

export { MIN_USEFUL_BODY, MAX_BODY };
