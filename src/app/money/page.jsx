import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('money');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Money & Markets" path="/money" />
      <CategoryPage sectionId="money" title="Money & Markets" layoutVariant="money" />
    </>
  );
}
