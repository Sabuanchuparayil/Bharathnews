import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('tech');

export default function Page() {
  return <CategoryPage sectionId="tech" title="Tech & Science" />;
}
