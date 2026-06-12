import Terms from '@/views/Terms';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Terms of Service',
  description: 'Terms of service for The Bharath News. Read our terms and conditions for using the platform.',
  path: '/terms',
});

export default function Page() { return <Terms />; }
