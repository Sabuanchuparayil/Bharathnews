import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('life');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Life & Culture" path="/life" />
      <CategoryPage sectionId="life" title="Life & Culture" layoutVariant="life" />
    </>
  );
}
