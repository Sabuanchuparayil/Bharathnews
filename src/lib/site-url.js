/** Canonical production hosts — www is the live Railway custom domain. */
export const SITE_APEX_HOST = 'thebharathnews.com';
export const SITE_CANONICAL_HOST = 'www.thebharathnews.com';
export const DEFAULT_SITE_URL = `https://${SITE_CANONICAL_HOST}`;

export function getSiteUrl() {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  return url || DEFAULT_SITE_URL;
}

/** Resolved at build time from NEXT_PUBLIC_SITE_URL or www default. */
export const SITE_URL = getSiteUrl();
