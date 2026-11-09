import Link from 'next/link';
import { notFound } from 'next/navigation';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteMetadata } from '@/lib/metadata';
import { GUIDES, getGuide } from '@/data/guides';

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return siteMetadata({
    title: guide.title,
    description: guide.summary,
    path: `/guides/${guide.slug}`,
  });
}

export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Guides', href: '/guides' },
          { name: guide.title },
        ]} />
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 dark:text-white leading-tight">
          {guide.title}
        </h1>
        <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">{guide.summary}</p>
        <div className="mt-8 space-y-6">
          {guide.sections.map(section => (
            <section key={section.heading}>
              <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">{section.heading}</h2>
              <p className="mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        <aside className="mt-8 rounded-2xl border border-stone-200 dark:border-white/10 p-4">
          <h2 className="font-display font-bold text-sm text-stone-900 dark:text-white">Official pages</h2>
          <ul className="mt-2 space-y-1">
            {guide.official.map(link => (
              <li key={link.href}>
                <a href={link.href} className="text-brand-700 dark:text-brand-300 hover:underline" {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            Not legal, tax, or financial advice. Confirm the current rule on the official page.
          </p>
        </aside>
        <p className="mt-6">
          <Link href="/guides" className="text-sm font-medium text-brand-700 dark:text-brand-300 hover:underline">
            All guides
          </Link>
        </p>
      </article>
    </Layout>
  );
}
