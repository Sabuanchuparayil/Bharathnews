import EditorialPolicy from '@/views/EditorialPolicy';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Editorial & Corrections Policy',
  description:
    'How The Bharath News produces, verifies, and corrects journalism across English, Malayalam, Hindi, and Tamil.',
  path: '/editorial',
});

export default function Page() {
  return <EditorialPolicy />;
}
