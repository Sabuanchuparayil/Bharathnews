/** @type {import('next').NextConfig} */
const env = (nextKey, viteKey) => process.env[nextKey] || process.env[viteKey] || '';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://*.firebaseapp.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https: http:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com wss://*.firebaseio.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://*.cloudfunctions.net https://*.workers.dev https://api.rss2json.com",
      "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://pagead2.googlesyndication.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: '*.oneindia.com' },
      { protocol: 'https', hostname: '*.hindustantimes.com' },
      { protocol: 'https', hostname: '*.ndtv.com' },
      { protocol: 'https', hostname: '*.indiatimes.com' },
    ],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        source: '/article/:slug',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, s-maxage=300, stale-while-revalidate=600' },
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: env('NEXT_PUBLIC_FIREBASE_API_KEY', 'VITE_FIREBASE_API_KEY'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: env('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_AUTH_DOMAIN'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: env('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_PROJECT_ID'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: env('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'VITE_FIREBASE_STORAGE_BUCKET'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: env('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
    NEXT_PUBLIC_FIREBASE_APP_ID: env('NEXT_PUBLIC_FIREBASE_APP_ID', 'VITE_FIREBASE_APP_ID'),
    NEXT_PUBLIC_WORKER_URL: env('NEXT_PUBLIC_WORKER_URL', 'VITE_WORKER_URL'),
    NEXT_PUBLIC_WHATSAPP_CHANNEL_URL: env('NEXT_PUBLIC_WHATSAPP_CHANNEL_URL', 'VITE_WHATSAPP_CHANNEL_URL'),
    NEXT_PUBLIC_TELEGRAM_CHANNEL_ID: env('NEXT_PUBLIC_TELEGRAM_CHANNEL_ID', 'VITE_TELEGRAM_CHANNEL_ID'),
    NEXT_PUBLIC_SITE_URL: env('NEXT_PUBLIC_SITE_URL', 'VITE_SITE_URL'),
  },
};

export default nextConfig;
