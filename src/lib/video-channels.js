export function channelIdFromSourceUrl(url) {
  const text = String(url || '');
  const query = text.match(/[?&]channel_id=([A-Za-z0-9_-]+)/);
  if (query) return query[1];
  const path = text.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
  return path ? path[1] : '';
}

export function normalizeVideoChannel(row) {
  const channelId = channelIdFromSourceUrl(row?.url);
  const name = String(row?.name || '').trim();
  if (!channelId || !name) return null;
  return {
    channelId,
    name,
    category: row.category || 'india',
    language: row.language || 'en',
  };
}
