import { categoryMetadata } from '@/lib/category-metadata';
import SectionPage from '@/views/SectionPage';

export const metadata = categoryMetadata('life');

export default function Page() {
  return <SectionPage sectionId="life" title="Life & Culture" layoutVariant="life" />;
}
