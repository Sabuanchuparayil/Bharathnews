/** Stable ASCII slugs for all articles — required for Facebook/dlvr.it link previews. */

function hashStr(input) {
  let h = 0;
  const s = String(input || '');
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

export function slugifyArticle(title, { language = 'en', sourceUrl = '', id = '' } = {}) {
  const ascii = (title || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

  const idPart = String(id || '').replace(/-/g, '').slice(0, 8);
  const suffix = idPart || hashStr(sourceUrl || title).slice(0, 8);
  const lang = (language || 'en').replace(/[^a-z]/gi, '').slice(0, 4).toLowerCase() || 'en';

  if (ascii.length >= 10) {
    return `${ascii}-${suffix}`.slice(0, 80);
  }

  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `${lang}-news-${datePart}-${suffix}`.slice(0, 80);
}

export function isAsciiSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
