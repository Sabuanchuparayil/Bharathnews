import Videos from '@/views/Videos';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'News Videos — India, Cricket, Bollywood & GCC Updates',
  description: 'Watch latest India news videos — breaking stories, cricket highlights, Bollywood updates, Gulf/GCC community news, and regional language video content in Malayalam, Hindi, Tamil, Telugu, Kannada, and Bengali.',
  path: '/videos',
  keywords: [
    'India news videos', 'breaking news video India', 'cricket highlights video',
    'Bollywood news video', 'IPL highlights', 'GCC news video',
    'Malayalam news video', 'Hindi news video', 'Tamil news video',
    'Telugu news video', 'Kannada news video', 'Indian YouTube news',
    'India politics video', 'Modi speech video', 'India current affairs video',
  ],
});

export default function Page() { return <Videos />; }
