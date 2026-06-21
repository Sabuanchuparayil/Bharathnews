import { categoryMetadata } from '@/lib/category-metadata';
import SectionPage from '@/views/SectionPage';

export const metadata = categoryMetadata('money');

export default function Page() {
  return <SectionPage sectionId="money" title="Money & Markets" layoutVariant="money" />;
}
