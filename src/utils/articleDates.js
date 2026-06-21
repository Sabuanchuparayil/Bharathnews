/** When the article appeared on The Bharath News (ingest time), not the source RSS date. */

function toMs(value) {
  if (!value) return 0;
  if (typeof value === 'object' && 'seconds' in value) return value.seconds * 1000;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

export function articleFreshnessMs(article) {
  const created = toMs(article?.createdAt);
  const published = toMs(article?.publishedAt);
  return Math.max(created, published);
}

export function articleDisplayDate(article) {
  const created = article?.createdAt;
  const published = article?.publishedAt;
  if (created && published) {
    return toMs(created) >= toMs(published) ? created : published;
  }
  return created || published || null;
}
