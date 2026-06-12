import { REGIONAL_LANGUAGES } from './regional-feeds.js';

/** Share of ingest/video slots reserved for regional-language sources. */
export const REGIONAL_WEIGHT = 0.65;

export function isRegionalSource(source) {
  return REGIONAL_LANGUAGES.includes(source?.language);
}

/**
 * Pick sources/channels for a run. Empty-category sources go first, then
 * ~65% regional (round-robin by language), then general English sources.
 */
export function rotateSourcePick(sources, maxTotal, priorityCategories = new Set()) {
  const ts = (s) => (s.lastFetchedAt ? new Date(s.lastFetchedAt).getTime() : 0);

  const priority = [];
  const regional = [];
  const general = [];

  for (const s of sources) {
    if (priorityCategories.has(s.category)) priority.push(s);
    else if (isRegionalSource(s)) regional.push(s);
    else general.push(s);
  }

  priority.sort((a, b) => ts(a) - ts(b));
  regional.sort((a, b) => ts(a) - ts(b));
  general.sort((a, b) => ts(a) - ts(b));

  const picked = [];
  const seenCats = new Set();

  for (const s of priority) {
    if (picked.length >= maxTotal) break;
    if (!seenCats.has(s.category)) {
      picked.push(s);
      seenCats.add(s.category);
    }
  }

  const regionalQuota = Math.min(
    regional.length,
    Math.max(0, Math.ceil(maxTotal * REGIONAL_WEIGHT) - picked.length),
  );

  const byLang = {};
  for (const s of regional) {
    const lang = s.language || 'en';
    (byLang[lang] = byLang[lang] || []).push(s);
  }
  const langs = Object.keys(byLang);
  let added = true;
  while (picked.length < maxTotal && picked.filter(isRegionalSource).length < regionalQuota && added) {
    added = false;
    for (const lang of langs) {
      const next = byLang[lang].shift();
      if (next && !picked.includes(next)) {
        picked.push(next);
        added = true;
        if (picked.filter(isRegionalSource).length >= regionalQuota) break;
      }
    }
  }

  for (const s of general) {
    if (picked.length >= maxTotal) break;
    if (!picked.includes(s)) picked.push(s);
  }

  if (picked.length) {
    const regionalCount = picked.filter(isRegionalSource).length;
    console.log(
      `[rotation] picked ${picked.length} (${regionalCount} regional / ${Math.round(REGIONAL_WEIGHT * 100)}% target):`,
      picked.map(s => `${s.name}(${s.language || 'en'})`).join(', '),
    );
  }

  return picked;
}
