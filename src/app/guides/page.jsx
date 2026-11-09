import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteMetadata } from '@/lib/metadata';
import { GUIDES } from '@/data/guides';

export const metadata = siteMetadata({
  title: 'NRI guides for Malayalis in the Gulf',
  description: 'Passport renewal, police clearance, OCI, NRE accounts, and other practical notes for Malayali NRIs, with links to the official offices.',
  path: '/guides',
  keywords: ['NRI guide Gulf', 'Indian passport renewal UAE', 'PCC for Gulf job', 'NRE NRO account'],
});

export default function GuidesPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Guides' }]} />
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 dark:text-white">
          Guides for Gulf Malayalis
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          Short notes on the papers and accounts NRIs ask about. Each one points at the office that actually decides. Fees and forms change, so the official link is the last step.
        </p>
        <ul className="mt-8 divide-y divide-stone-200 dark:divide-white/10">
          {GUIDES.map(guide => (
            <li key={guide.slug}>
              <Link href={`/guides/${guide.slug}`} className="block py-4 group">
                <span className="font-display font-bold text-lg text-stone-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-brand-300">
                  {guide.title}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400 mt-1">{guide.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
