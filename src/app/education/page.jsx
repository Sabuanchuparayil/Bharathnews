import { categoryMetadata } from '@/lib/category-metadata';
import Education from '@/views/Education';

export const metadata = categoryMetadata('education');

export default function Page() {
  return <Education />;
}
