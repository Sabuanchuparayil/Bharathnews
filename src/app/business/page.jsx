import { categoryMetadata } from '@/lib/category-metadata';
import Business from '@/views/Business';

export const metadata = categoryMetadata('business');

export default function Page() {
  return <Business />;
}
