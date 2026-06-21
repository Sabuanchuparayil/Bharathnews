/** Publishers we do not ingest or display. */

export const BLOCKED_SOURCE_NAMES = ['janam tv', 'janamtv'];

export const BLOCKED_URL_PATTERNS = [
  /janamtv\.com/i,
  /janam\.tv/i,
];

export function isBlockedPublisher({ name = '', url = '', sourceUrl = '' } = {}) {
  const n = (name || '').toLowerCase();
  if (BLOCKED_SOURCE_NAMES.some(b => n.includes(b))) return true;
  const urls = [url, sourceUrl].filter(Boolean);
  return urls.some(u => BLOCKED_URL_PATTERNS.some(re => re.test(u)));
}

export function filterBlockedSources(sources = []) {
  return sources.filter(s => !isBlockedPublisher({ name: s.name, url: s.url }));
}
