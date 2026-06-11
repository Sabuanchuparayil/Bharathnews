import CreatorProfile from '@/views/CreatorProfile';
import { getCreatorProfileBySlugServer } from '@/services/firestore-server';
import { siteMetadata } from '@/lib/metadata';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const profile = await getCreatorProfileBySlugServer(handle);
  if (!profile) return { title: 'Creator not found' };
  return siteMetadata({
    title: `@${profile.slug} | ${profile.displayName}`,
    description: profile.bio || `${profile.displayName} on The Bharath News`,
    path: `/@${profile.slug}`,
    image: profile.photoURL,
  });
}

export default async function CreatorProfilePage({ params }) {
  const { handle } = await params;
  const profile = await getCreatorProfileBySlugServer(handle);
  if (!profile) notFound();
  return <CreatorProfile username={handle} initialProfile={profile} />;
}
