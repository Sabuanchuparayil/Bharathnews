import Explore from '@/views/Explore';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Explore Topics',
  description: 'Explore all news categories — India, GCC, business, technology, sports, entertainment, health, education, jobs, real estate, world news, and more.',
  path: '/explore',
  keywords: ['explore news', 'news categories', 'India news topics'],
});

export default function Page() { return <Explore />; }
