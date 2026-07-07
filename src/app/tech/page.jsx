import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('tech');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Tech & Science" path="/tech" />
      <CategoryPage sectionId="tech" title="Tech & Science" />
    </>
  );
}
