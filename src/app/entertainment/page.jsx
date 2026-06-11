import { categoryMetadata } from '@/lib/category-metadata';
import Entertainment from '@/views/Entertainment';

export const metadata = categoryMetadata('entertainment');

export default function Page() {
  return <Entertainment />;
}
