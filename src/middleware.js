import { NextResponse } from 'next/server';
import { SITE_APEX_HOST, SITE_CANONICAL_HOST } from '@/lib/site-url';

const AUTH_REQUIRED = ['/dashboard', '/settings', '/bookmarks', '/creator', '/employer', '/jobs/post', '/jobs/my', '/classifieds/post', '/classifieds/my'];
const ADMIN_PREFIX = '/admin';
const VALID_ROLES = new Set(['reader', 'admin', 'content_writer', 'contributor', 'vlogger', 'employer']);

function requiresAuth(pathname) {
  return AUTH_REQUIRED.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function sanitizeNext(nextPath) {
  if (!nextPath || typeof nextPath !== 'string') return '/dashboard';
  const decoded = decodeURIComponent(nextPath);
  if (decoded.startsWith('/') && !decoded.startsWith('//') && !decoded.includes('\\')) return decoded;
  return '/dashboard';
}

export function middleware(request) {
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
  const role = VALID_ROLES.has(rawRole) ? rawRole : 'reader';

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');

  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!auth || auth !== '1') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', sanitizeNext(pathname));
      url.searchParams.set('reason', 'admin');
      return NextResponse.redirect(url);
    }
    if (role !== 'admin') {
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
