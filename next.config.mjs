/** @type {import('next').NextConfig} */
const env = (nextKey, viteKey) => process.env[nextKey] || process.env[viteKey] || '';

const nextConfig = {
  reactStrictMode: true,
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
