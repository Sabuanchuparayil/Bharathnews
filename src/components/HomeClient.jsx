'use client';

import dynamic from 'next/dynamic';

const Home = dynamic(() => import('@/views/Home'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-surface-1 dark:bg-dark-surface-0">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function HomeClient() {
  return <Home />;
}
