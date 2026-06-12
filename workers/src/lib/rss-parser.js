/**
 * Lightweight RSS/Atom XML parser for Cloudflare Workers.
 * No external dependencies — uses regex extraction on raw XML.
 */

function extractTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
  const re = new RegExp(`<${tag}[^>]*${attr}=["']([^"']*)["']`, 'i');
  const m = xml.match(re);
  return m ? m[1] : '';
}

function decodeEntities(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      const cp = parseInt(hex, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const cp = parseInt(dec, 10);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _;
    })
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function isAudioVideoEnclosure(url) {
  return /\.(mp3|mp4)(?:[?#]|$)/i.test(url);
}

function extractImage(itemXml) {
  const encUrl = extractAttr(itemXml, 'enclosure', 'url');
  if (encUrl && !isAudioVideoEnclosure(encUrl)) return encUrl;

  for (const tag of ['media:content', 'media:thumbnail', 'media:group']) {
    const mediaUrl = extractAttr(itemXml, tag, 'url');
    if (mediaUrl) return mediaUrl;
  }

  const imgMatch = itemXml.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return '';
}

function parseRSS(xml) {
  const items = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    items.push({
      // decodeEntities BEFORE stripHtml so CDATA-wrapped titles survive (stripHtml's
      // <[^>]*> regex would otherwise eat the whole <![CDATA[...]]> block).
      title: stripHtml(decodeEntities(extractTag(block, 'title'))),
      link: decodeEntities(extractTag(block, 'link') || extractTag(block, 'guid')).trim(),
      description: stripHtml(decodeEntities(extractTag(block, 'description'))).slice(0, 500),
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'dc:date'),
      imageUrl: extractImage(block),
    });
  }
  return items;
}

function parseAtom(xml) {
  const items = [];
  const entryRegex = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const block = match[1];
    const link = extractAttr(block, 'link', 'href') || extractTag(block, 'link');
    items.push({
      title: stripHtml(decodeEntities(extractTag(block, 'title'))),
      link: decodeEntities(link).trim(),
      description: stripHtml(decodeEntities(
        extractTag(block, 'summary') || extractTag(block, 'content')
      )).slice(0, 500),
      pubDate: extractTag(block, 'published') || extractTag(block, 'updated'),
      imageUrl: extractImage(block),
    });
  }
  return items;
}

/**
 * Google News and OneIndia block Cloudflare datacenter IPs.
 * Route both through rss2json.com which fetches from non-blocked IPs.
 */
function needsRss2JsonProxy(url) {
  return url.includes('news.google.com/') || url.includes('oneindia.com/');
}

async function fetchViaRss2Json(url) {
  // Free tier: no `count` param (requires API key); returns 10 items by default.
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'ok' || !Array.isArray(data.items)) return [];
    return data.items.map(item => ({
      title: stripHtml(decodeEntities(item.title || '')),
      link: item.link || item.guid || '',
      description: stripHtml(decodeEntities(item.description || '')).slice(0, 500),
      pubDate: item.pubDate || '',
      imageUrl: item.thumbnail || item.enclosure?.link || '',
    })).filter(i => i.title && i.link);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAndParseFeed(url) {
  if (needsRss2JsonProxy(url)) {
    return fetchViaRss2Json(url);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TheBharathNews/1.0 (RSS Reader)' },
      cf: { cacheTtl: 300, cacheEverything: true },
      signal: controller.signal,
    });

    if (!response.ok) {
      const proxied = await fetchViaRss2Json(url);
      if (proxied.length) return proxied;
      return [];
    }

    const xml = await response.text();
    const isAtom = xml.includes('<feed') && xml.includes('<entry');
    const items = isAtom ? parseAtom(xml) : parseRSS(xml);
    if (!items.length) {
      const proxied = await fetchViaRss2Json(url);
      if (proxied.length) return proxied;
    }
    return items;
  } catch {
    const proxied = await fetchViaRss2Json(url).catch(() => []);
    return proxied;
  } finally {
    clearTimeout(timeout);
  }
}
