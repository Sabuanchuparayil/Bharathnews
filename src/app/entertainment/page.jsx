import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Entertainment from '@/views/Entertainment';

export const metadata = categoryMetadata('entertainment');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Entertainment" path="/entertainment" />
      <Entertainment />
    </>
  );
}
