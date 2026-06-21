import CreatorPost from '@/views/CreatorPost';
import { getCreatorPostServer } from '@/services/articles-server';
import { siteMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const post = await getCreatorPostServer(postId);
  if (!post) return { title: 'Post not found' };
  return siteMetadata({
    title: post.title,
    description: post.excerpt || post.summary || post.content?.slice(0, 160),
    path: `/creator/post/${postId}`,
    image: post.coverImage || post.thumbnail,
    type: 'article',
  });
}

export default async function CreatorPostPage({ params }) {
  const { postId } = await params;
  const post = await getCreatorPostServer(postId);
  if (!post) notFound();
  return <CreatorPost postId={postId} initialPost={post} />;
}
