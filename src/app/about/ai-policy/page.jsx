import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteMetadata } from '@/lib/metadata';

export const metadata = siteMetadata({
  title: 'How AI-assisted stories are published',
  description: 'The Bharath News desk may draft with Claude, then a person reviews the copy, names the author, and publishes it.',
  path: '/about/ai-policy',
});

export default function AiPolicyPage() {
  return (
    <Layout>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'About', href: '/about' }, { name: 'AI-assisted stories' }]} />
        <h1 className="font-display font-bold text-3xl text-stone-900 dark:text-white">AI-assisted stories</h1>
        <div className="mt-4 space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            Some platform stories start as a draft written with Claude. A content writer or editor pastes that draft into the newsroom, adds the author name, and chooses a cover image.
          </p>
          <p>
            The story stays unpublished until someone on the desk approves it. The byline is the name entered on the draft. Stories marked AI-assisted show that label under the author.
          </p>
          <p>
            Pravasi Jaalakam pieces are separate. Those come from creators and are read in the moderation queue before they appear.
          </p>
          <p>
            <Link href="/editorial" className="text-brand-700 dark:text-brand-300 hover:underline">Read the editorial and corrections policy.</Link>
          </p>
        </div>
      </article>
    </Layout>
  );
}
