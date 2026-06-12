import Contact from '@/views/Contact';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Contact Us',
  description: 'Contact The Bharath News for editorial enquiries, corrections, tips, advertising, and support.',
  path: '/contact',
});

export default function Page() {
  return <Contact />;
}
