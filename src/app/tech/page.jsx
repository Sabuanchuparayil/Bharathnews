import { categoryMetadata } from '@/lib/category-metadata';
import SectionPage from '@/views/SectionPage';

export const metadata = categoryMetadata('tech');

export default function Page() {
  return <SectionPage sectionId="tech" title="Tech & Science" />;
}
