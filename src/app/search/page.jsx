import { Suspense } from 'react';
import Search from '@/views/Search';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Search News',
  description: 'Search for the latest news articles from India and GCC regions on The Bharath News.',
  path: '/search',
});

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <Search />
    </Suspense>
  );
}
