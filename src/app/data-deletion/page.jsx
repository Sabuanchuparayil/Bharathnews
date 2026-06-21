import DataDeletion from '@/views/DataDeletion';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'Data Deletion',
  description: 'Request deletion of your personal data from The Bharath News.',
  path: '/data-deletion',
});

export default function Page() { return <DataDeletion />; }
