import { categoryMetadata } from '@/lib/category-metadata';
import Technology from '@/views/Technology';

export const metadata = categoryMetadata('technology');

export default function Page() {
  return <Technology />;
}
