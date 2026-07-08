import { slugify } from '@/utils/slugify';

export function uniqueMarketplaceSlug(title, suffix = '') {
  const base = slugify(title) || 'listing';
  const rand = suffix || Math.random().toString(36).slice(2, 8);
  return `${base}-${rand}`.slice(0, 80);
}

export function employerSlugFromCompany(companyName, userId) {
  const base = slugify(companyName) || 'employer';
  const shortId = (userId || '').slice(0, 8);
  return `${base}-${shortId}`.slice(0, 60);
}
