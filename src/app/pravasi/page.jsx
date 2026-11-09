import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import ShareButton from '@/components/ShareButton';
import { siteMetadata } from '@/lib/metadata';
import { CREATOR_CONTENT_TYPES } from '@/config/feeds.config';
import { listFeaturedCreators, listPublishedPravasiPosts } from '@/services/articles-server';
import { pravasiPublicPath } from '@/lib/pravasi';

export const dynamic = 'force-dynamic';

export const metadata = siteMetadata({
  title: 'Pravasi Jaalakam — stories and poems from Gulf Malayalis',
  description: 'A literary corner for Malayalis in the Gulf. Stories, poems, and essays, sent by readers and read before they are published.',
  path: '/pravasi',
  keywords: ['Pravasi Jaalakam', 'Malayalam stories Gulf', 'Malayali poems UAE'],
});

export default async function PravasiPage() {
  const [posts, creators] = await Promise.all([
    listPublishedPravasiPosts(12),
    listFeaturedCreators(6),
  ]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Pravasi Jaalakam' }]} />
        <p className="text-sm font-semibold tracking-wide text-brand-700 dark:text-brand-300">പ്രവാസി ജാലകം</p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 dark:text-white mt-1">
          Pravasi Jaalakam
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          Stories, poems, and essays from Malayalis who live between Kerala and the Gulf. This is not the news desk. A person reads every submission before it goes up.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/creator/apply" className="btn-primary">Write for Pravasi Jaalakam</Link>
          <Link href="/community" className="btn-secondary">Community desk</Link>
          <ShareButton
            title="Write for Pravasi Jaalakam"
            text="Stories and poems from Malayalis in the Gulf."
            path="/creator/apply"
            contentType="pravasi_invite"
            showLabel
          />
        </div>

        <h2 className="font-display font-bold text-2xl mt-10 text-stone-900 dark:text-white">Latest</h2>
        {posts.length === 0 && (
          <p className="mt-3 text-gray-500">No published pieces yet. The first story can be yours.</p>
        )}
        <ul className="mt-4 space-y-3">
          {posts.map(post => (
            <li key={post.id}>
              <Link href={pravasiPublicPath(post)} className="block rounded-2xl border border-stone-200 dark:border-white/10 p-4 hover:border-brand-600">
                <p className="text-xs uppercase text-brand-700 dark:text-brand-300">{post.type}</p>
                <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white">{post.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{post.authorName}</p>
                {post.excerpt && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{post.excerpt}</p>}
              </Link>
            </li>
          ))}
        </ul>

        {creators.length > 0 && (
          <>
            <h2 className="font-display font-bold text-2xl mt-10 text-stone-900 dark:text-white">Writers</h2>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {creators.map(creator => (
                <li key={creator.slug}>
                  <Link href={`/@${creator.slug}`} className="block rounded-2xl border border-stone-200 dark:border-white/10 p-4 hover:border-brand-600">
                    <h3 className="font-display font-bold text-stone-900 dark:text-white">{creator.displayName || creator.slug}</h3>
                    <p className="text-xs text-gray-500 mt-1">{creator.followerCount || 0} followers</p>
                    {creator.bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{creator.bio}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        <h2 className="font-display font-bold text-2xl mt-10 text-stone-900 dark:text-white">What you can send</h2>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CREATOR_CONTENT_TYPES.map(type => (
            <li key={type.id} className="rounded-2xl border border-stone-200 dark:border-white/10 p-4">
              <h3 className="font-display font-bold text-lg text-stone-900 dark:text-white">{type.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{type.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
