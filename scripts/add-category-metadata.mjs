import { writeFileSync } from 'fs';
import { join } from 'path';

const APP = join(import.meta.dirname, '..', 'src', 'app');

const cats = [
  { folder: 'india', slug: 'india', component: 'India' },
  { folder: 'gcc', slug: 'gcc', component: 'GCC' },
  { folder: 'business', slug: 'business', component: 'Business' },
  { folder: 'technology', slug: 'technology', component: 'Technology' },
  { folder: 'sports', slug: 'sports', component: 'Sports' },
  { folder: 'entertainment', slug: 'entertainment', component: 'Entertainment' },
  { folder: 'health', slug: 'health', component: 'Health' },
  { folder: 'education', slug: 'education', component: 'Education' },
  { folder: 'jobs', slug: 'jobs', component: 'Jobs' },
  { folder: 'real-estate', slug: 'real-estate', component: 'RealEstate' },
  { folder: 'lifestyle', slug: 'lifestyle', component: 'Lifestyle' },
  { folder: 'opinion', slug: 'opinion', component: 'Opinion' },
];

for (const { folder, slug, component } of cats) {
  writeFileSync(join(APP, folder, 'page.jsx'), `import { categoryMetadata } from '@/lib/category-metadata';
import ${component} from '@/views/${component}';

export const metadata = categoryMetadata('${slug}');

export default function Page() {
  return <${component} />;
}
`);
}
console.log('Updated category metadata');
