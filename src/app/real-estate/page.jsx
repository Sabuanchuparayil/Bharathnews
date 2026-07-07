import CategoryPageSchema from '@/components/CategoryPageSchema';
import { categoryMetadata } from '@/lib/category-metadata';
import RealEstate from '@/views/RealEstate';

export const metadata = categoryMetadata('real-estate');

export default function Page() {
  return (
    <>
      <CategoryPageSchema title="Real Estate" path="/real-estate" />
      <RealEstate />
    </>
  );
}
