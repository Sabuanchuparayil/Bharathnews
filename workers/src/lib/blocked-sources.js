/** Publishers we do not ingest or display. */

export const BLOCKED_SOURCE_NAMES = [
  'janam tv',
  'janamtv',
  'republic tv',
  'republictv',
  'republic world',
  'republicworld',
  'republic bharat',
  'republicbharat',
];

export const BLOCKED_URL_PATTERNS = [
  /janamtv\.com/i,
  /janam\.tv/i,
  /republicworld\.com/i,
  /republictv\.com/i,
  /republicbharat\.com/i,
];

const BLOCKED_BYLINE = /(?:^|[|\-–])\s*(janam\s*tv|republic\s+(?:world|tv|bharat))\s*$/i;

export function isBlockedPublisher({ name = '', url = '', sourceUrl = '', title = '' } = {}) {
  const n = (name || '').toLowerCase();
  if (BLOCKED_SOURCE_NAMES.some(b => n.includes(b))) return true;
  if (title && BLOCKED_BYLINE.test(title)) return true;
  const urls = [url, sourceUrl].filter(Boolean);
  return urls.some(u => BLOCKED_URL_PATTERNS.some(re => re.test(u)));
}

export function filterBlockedSources(sources = []) {
  return sources.filter(s => !isBlockedPublisher({ name: s.name, url: s.url }));
}
