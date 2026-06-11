import { categoryMetadata } from '@/lib/category-metadata';
import India from '@/views/India';

export const metadata = categoryMetadata('india');

export default function Page() {
  return <India />;
}
