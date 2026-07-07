import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Sports from '@/views/Sports';

export const metadata = categoryMetadata('sports');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Sports" path="/sports" />
      <Sports />
    </>
  );
}
