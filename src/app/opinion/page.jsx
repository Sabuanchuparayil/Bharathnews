import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Opinion from '@/views/Opinion';

export const metadata = categoryMetadata('opinion');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Opinion" path="/opinion" />
      <Opinion />
    </>
  );
}
