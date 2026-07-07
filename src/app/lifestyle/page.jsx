import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Lifestyle from '@/views/Lifestyle';

export const metadata = categoryMetadata('lifestyle');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Lifestyle" path="/lifestyle" />
      <Lifestyle />
    </>
  );
}
