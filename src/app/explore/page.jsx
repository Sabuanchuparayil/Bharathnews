import Explore from '@/views/Explore';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Discover',
  description: 'Discover every section of The Bharath News — Money, Sports, Tech, Life, World, and more.',
  path: '/explore',
  keywords: ['discover news', 'news sections', 'India GCC diaspora news'],
});

export default function Page() { return <Explore />; }
