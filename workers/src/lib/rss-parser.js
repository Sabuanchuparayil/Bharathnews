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
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractImage(itemXml) {
  const encUrl = extractAttr(itemXml, 'enclosure', 'url');
  if (encUrl) return encUrl;

  const mediaUrl = extractAttr(itemXml, 'media:content', 'url') ||
                   extractAttr(itemXml, 'media:thumbnail', 'url');
  if (mediaUrl) return mediaUrl;

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
      title: decodeEntities(stripHtml(extractTag(block, 'title'))),
      link: decodeEntities(extractTag(block, 'link') || extractTag(block, 'guid')),
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
      title: decodeEntities(stripHtml(extractTag(block, 'title'))),
      link: decodeEntities(link),
      description: stripHtml(decodeEntities(
        extractTag(block, 'summary') || extractTag(block, 'content')
      )).slice(0, 500),
      pubDate: extractTag(block, 'published') || extractTag(block, 'updated'),
      imageUrl: extractImage(block),
    });
  }
  return items;
}

export async function fetchAndParseFeed(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TheBharathNews/1.0 (RSS Reader)' },
    cf: { cacheTtl: 300, cacheEverything: true },
  });

  if (!response.ok) return [];

  const xml = await response.text();
  const isAtom = xml.includes('<feed') && xml.includes('<entry');
  return isAtom ? parseAtom(xml) : parseRSS(xml);
}
