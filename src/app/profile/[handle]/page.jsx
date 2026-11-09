import CreatorProfile from '@/views/CreatorProfile';
import { getCreatorProfileBySlugServer } from '@/services/articles-server';
import { siteMetadata, safeJsonLd } from '@/lib/metadata';
import { SITE_URL } from '@/lib/site-url';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const profile = await getCreatorProfileBySlugServer(handle);
  if (!profile) return { title: 'Creator not found' };
  return siteMetadata({
    title: `@${profile.slug} | ${profile.displayName}`,
    description: profile.tagline || profile.bio || `${profile.displayName} on The Bharath News`,
    path: `/@${profile.slug}`,
    image: profile.photoURL,
  });
}

export default async function CreatorProfilePage({ params }) {
  const { handle } = await params;
  const profile = await getCreatorProfileBySlugServer(handle);
  if (!profile) notFound();
  const sameAs = Object.values(profile.socialLinks || {}).filter(url => typeof url === 'string' && url.startsWith('http'));
  const place = profile.location || [profile.city, profile.country].filter(Boolean).join(', ');
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.displayName,
    url: `${SITE_URL}/@${profile.slug}`,
    description: profile.bio || profile.tagline || undefined,
    image: profile.photoURL || undefined,
    jobTitle: profile.profession || undefined,
    homeLocation: place ? { '@type': 'Place', name: place } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(person) }} />
      <CreatorProfile username={handle} initialProfile={profile} />
    </>
  );
}
