/**
 * Subdomain routing handler for creator profiles.
 * Resolves username.thebharathnews.com -> thebharathnews.com/@username
 *
 * Requires wildcard DNS (*.thebharathnews.com) pointing to the worker or origin.
 * Falls back gracefully if MAIN_SITE_URL is not configured.
 */

export const handleSubdomainRedirect = (request, env) => {
  const url = new URL(request.url);
  const hostname = url.hostname;
  const mainHost = env.MAIN_SITE_HOST || 'thebharathnews.com';

  // Skip if already on main domain or www
  if (hostname === mainHost || hostname === `www.${mainHost}` || hostname === 'localhost') {
    return null;
  }

  // Extract subdomain: e.g. sabuj.thebharathnews.com -> sabuj
  const parts = hostname.split('.');
  const mainParts = mainHost.split('.');

  if (parts.length < mainParts.length + 1) return null;

  const subdomain = parts[0];
  if (['www', 'api', 'bharathnews-api'].includes(subdomain)) return null;

  const mainSiteUrl = env.MAIN_SITE_URL || `https://${mainHost}`;
  const redirectUrl = `${mainSiteUrl}/@${subdomain}${url.pathname === '/' ? '' : url.pathname}${url.search}`;

  return Response.redirect(redirectUrl, 301);
};
