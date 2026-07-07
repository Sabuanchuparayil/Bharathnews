import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import India from '@/views/India';

export const metadata = categoryMetadata('india');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="India" path="/india" />
      <India />
    </>
  );
}
