import Videos from '@/views/Videos';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Videos — Latest News Videos',
  description: 'Watch the latest news videos from India and GCC regions. Regional language news videos in Malayalam, Tamil, Kannada, Telugu, Bengali, and Hindi.',
  path: '/videos',
  keywords: ['news videos', 'India news videos', 'Malayalam news videos', 'Tamil news videos'],
});

export default function Page() { return <Videos />; }
