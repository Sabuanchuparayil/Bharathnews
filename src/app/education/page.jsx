import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Education from '@/views/Education';

export const metadata = categoryMetadata('education');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Education" path="/education" />
      <Education />
    </>
  );
}
