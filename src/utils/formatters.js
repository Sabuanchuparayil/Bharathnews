import { formatDistanceToNow, format } from 'date-fns';

export function formatPublishedDate(date) {
  if (!date) return '';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatFullDate(date) {
  if (!date) return '';
  const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
  return format(d, 'MMMM d, yyyy');
}

export function formatViews(count) {
  if (!count) return '0';
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toLocaleString();
}

export function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80);
}
