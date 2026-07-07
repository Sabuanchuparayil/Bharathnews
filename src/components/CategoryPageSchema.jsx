import { breadcrumbJsonLd, safeJsonLd } from '@/lib/metadata';

export default function CategoryPageSchema({ title, path }) {
  const breadcrumb = breadcrumbJsonLd([
    { name: 'Home', url: '/' },
    { name: title, url: path },
  ]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumb) }}
    />
  );
}
