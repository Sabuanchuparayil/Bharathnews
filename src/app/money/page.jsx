import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('money');

export default function Page() {
  return <CategoryPage sectionId="money" title="Money & Markets" layoutVariant="money" />;
}
