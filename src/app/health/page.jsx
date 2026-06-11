import { categoryMetadata } from '@/lib/category-metadata';
import Health from '@/views/Health';

export const metadata = categoryMetadata('health');

export default function Page() {
  return <Health />;
}
