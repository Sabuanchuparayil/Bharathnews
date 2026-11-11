import { NextResponse } from 'next/server';
import { SITE_APEX_HOST, SITE_CANONICAL_HOST } from '@/lib/site-url';
import { VALID_ROLES } from '@/lib/roles';
import { capsForRole, fallbackCaps, fetchAccessRolesPublic } from '@/lib/access-roles';

const AUTH_REQUIRED = ['/dashboard', '/settings', '/bookmarks', '/creator', '/employer', '/jobs/post', '/jobs/my', '/classifieds/post', '/classifieds/my'];
const ADMIN_PREFIX = '/admin';

function requiresAuth(pathname) {
  return AUTH_REQUIRED.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function sanitizeNext(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') return '/dashboard';
  const decoded = decodeURIComponent(nextPath);
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes('\\')) return decoded;
  return '/dashboard';
}

async function requestCaps(request, role, needsLookup) {
  const raw = request.cookies.get('bn_caps')?.value;
  if (raw === '0') return new Set();
  if (raw) return new Set(raw.split('.').filter(Boolean));
  if (VALID_ROLES.has(role)) return new Set(fallbackCaps(role));
  if (!needsLookup) return new Set();
  const catalog = await fetchAccessRolesPublic();
  return new Set(catalog ? capsForRole(catalog, role) : []);
}

/** Old URLs still requested by crawlers and shared links. */
const LEGACY_REDIRECTS = {
  '/gcc-jobs': '/jobs',
  '/discover': '/explore',
  '/news/money': '/money',
  '/news/sports': '/sports',
  '/news/tech': '/tech',
  '/news/technology': '/tech',
  '/news/life': '/life',
  '/news/lifestyle': '/life',
  '/news/world': '/world',
  '/news/kerala': '/india',
  '/news/india': '/india',
  '/news/gulf': '/gcc',
  '/news/gcc': '/gcc',
  '/news/business': '/business',
  '/news/health': '/health',
  '/news/education': '/education',
  '/news/entertainment': '/entertainment',
  '/news/opinion': '/opinion',
  '/news/jobs': '/jobs',
  '/news/real-estate': '/real-estate',
};

function isAssetPath(pathname) {
  return /\.(?:png|jpe?g|gif|webp|svg|ico|css|js|txt|xml|json|woff2?|map)$/i.test(pathname);
}

function isAccountGateOpen(pathname) {
  if (isAssetPath(pathname)) return true;
  if (pathname === '/login' || pathname === '/terms' || pathname === '/privacy' || pathname === '/contact') return true;
  if (pathname === '/about' || pathname.startsWith('/about/')) return true;
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/')) return true;
  return false;
}

function redirectAccount(request, pathname) {
  const url = request.nextUrl.clone();
  const next = sanitizeNext(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  url.pathname = pathname;
  url.search = '';
  if (next !== pathname && next !== '/verify-email' && next !== '/complete-profile' && next !== '/login') {
    url.searchParams.set('next', next);
  }
  return NextResponse.redirect(url);
}

function legacyRedirectPath(pathname) {
  if (LEGACY_REDIRECTS[pathname]) return LEGACY_REDIRECTS[pathname];
  if (pathname === '/news' || pathname.startsWith('/news/')) return '/';
  return null;
}

export async function middleware(request) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();

  if (host === SITE_APEX_HOST) {
    const url = request.nextUrl.clone();
    url.hostname = SITE_CANONICAL_HOST;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  if (host && host !== SITE_CANONICAL_HOST && host !== 'localhost' && !host.startsWith('192.168.') && !host.startsWith('127.')) {
    const url = request.nextUrl.clone();
    url.hostname = SITE_CANONICAL_HOST;
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 301);
  }

  const { pathname } = request.nextUrl;

  const redirected = legacyRedirectPath(pathname);
  if (redirected) {
    const url = request.nextUrl.clone();
    const lang = url.searchParams.get('lang');
    url.pathname = redirected;
    url.search = '';
    if (lang) url.searchParams.set('lang', lang);
    return NextResponse.redirect(url, 301);
  }

  if (pathname.startsWith('/@') && pathname.length > 2) {
    const username = pathname.slice(2).split('/')[0];
    if (username && !username.includes('.') && username.length <= 64) {
      const url = request.nextUrl.clone();
      url.pathname = `/profile/${encodeURIComponent(username)}`;
      return NextResponse.rewrite(url);
    }
  }

  const auth = request.cookies.get('bn_auth')?.value;
  const rawRole = request.cookies.get('bn_role')?.value || '';
  const role = VALID_ROLES.has(rawRole) ? rawRole : (rawRole || 'reader');
  const isStaffPath = pathname === '/desk' || pathname.startsWith('/desk/') || pathname.startsWith(ADMIN_PREFIX);
  const caps = await requestCaps(request, role, auth === '1' && isStaffPath);
  const verified = request.cookies.get('bn_verified')?.value === '1';
  const profileReady = request.cookies.get('bn_profile')?.value === '1';

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');

  if (pathname === '/desk' || pathname.startsWith('/desk/')) {
    if (!auth || auth !== '1') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', sanitizeNext(pathname));
      return NextResponse.redirect(url);
    }
    if (!caps.has('editorial') && !caps.has('admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', sanitizeNext(pathname));
      url.searchParams.set('reason', 'forbidden');
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!auth || auth !== '1') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', sanitizeNext(pathname));
      url.searchParams.set('reason', 'admin');
      return NextResponse.redirect(url);
    }
    if (!caps.has('admin')) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', sanitizeNext(pathname));
      url.searchParams.set('reason', 'forbidden');
      return NextResponse.redirect(url);
    }
  }

  if (requiresAuth(pathname) && (!auth || auth !== '1')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', sanitizeNext(pathname));
    return NextResponse.redirect(url);
  }

  if (auth === '1' && requiresAuth(pathname) && !isAccountGateOpen(pathname)) {
    if (!verified && pathname !== '/verify-email') {
      return redirectAccount(request, '/verify-email');
    }
    if (verified && !profileReady && pathname !== '/complete-profile' && pathname !== '/verify-email') {
      return redirectAccount(request, '/complete-profile');
    }
  }

  if (pathname === '/' && request.nextUrl.searchParams.get('login') === 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.delete('login');
    url.searchParams.set('next', '/admin/dashboard');
    url.searchParams.set('reason', 'admin');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.json|offline.html).*)',
  ],
};
