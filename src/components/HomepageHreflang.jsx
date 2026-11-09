import { headers } from 'next/headers';
import { SITE_URL } from '@/lib/site-url';

/** Homepage Malayalam alternate. Next.js metadata drops ?lang= on "/". */
export default async function HomepageHreflang() {
  const headerList = await headers();
  if (headerList.get('x-bn-path') !== '/') return null;

  const href = new URL('/?lang=ml', SITE_URL).toString();
  return <link rel="alternate" hrefLang="ml-IN" href={href} />;
}
