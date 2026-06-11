import { categoryMetadata } from '@/lib/category-metadata';
import CategoryPage from '@/views/CategoryPage';

export const metadata = categoryMetadata('world');

export default function Page() {
  return <CategoryPage category="world" title="World News" />;
}
