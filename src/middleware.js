import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/@') && pathname.length > 2) {
    const username = pathname.slice(2).split('/')[0];
    if (username && !username.includes('.')) {
      const url = request.nextUrl.clone();
      url.pathname = `/profile/${encodeURIComponent(username)}`;
      return NextResponse.rewrite(url);
    }
  }

  if (pathname.startsWith('/admin')) {
    const auth = request.cookies.get('bn_auth')?.value;
    if (!auth) {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      url.searchParams.set('login', 'admin');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/@(.*)', '/admin/:path*'],
};
