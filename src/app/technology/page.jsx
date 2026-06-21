import { redirect } from 'next/navigation';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Tech & Science | The Bharath News',
  description: 'Technology and science news — redirects to /tech',
  path: '/tech',
});

export default function Page() {
  redirect('/tech');
}
