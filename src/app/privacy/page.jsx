import Privacy from '@/views/Privacy';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Privacy Policy',
  description: 'Privacy policy for The Bharath News. Learn how we handle your data, cookies, and personal information.',
  path: '/privacy',
});

export default function Page() { return <Privacy />; }
