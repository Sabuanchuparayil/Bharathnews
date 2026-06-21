import { Suspense } from 'react';
import Search from '@/views/Search';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Search India & GCC News — Find Articles in 8 Languages',
  description: 'Search breaking news from India and Gulf countries. Find articles on politics, cricket, Bollywood, business, technology in English, Hindi, Malayalam, Tamil, Telugu, Kannada, Bengali & Urdu.',
  path: '/search',
  keywords: [
    'search India news', 'find news articles', 'India news search',
    'GCC news search', 'multilingual news search India',
    'search Malayalam news', 'search Hindi news', 'search Tamil news',
  ],
});

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <Search />
    </Suspense>
  );
}
