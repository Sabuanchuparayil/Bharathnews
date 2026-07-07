import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('world');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="World News" path="/world" />
      <CategoryPage sectionId="world" title="World News" layoutVariant="world" />
    </>
  );
}
