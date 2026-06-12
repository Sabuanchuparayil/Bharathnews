import Community from '@/views/Community';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Community',
  description: 'Join The Bharath News community. Share your perspectives, engage with creators, and participate in discussions about India and GCC news.',
  path: '/community',
});

export default function Page() { return <Community />; }
