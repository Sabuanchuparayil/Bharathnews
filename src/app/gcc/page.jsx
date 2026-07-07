import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import GCC from '@/views/GCC';

export const metadata = categoryMetadata('gcc');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="GCC" path="/gcc" />
      <GCC />
    </>
  );
}
