import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import Jobs from '@/views/Jobs';

export const metadata = categoryMetadata('jobs');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Jobs" path="/jobs" />
      <Jobs />
    </>
  );
}
