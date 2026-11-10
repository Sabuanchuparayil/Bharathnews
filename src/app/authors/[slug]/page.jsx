import AuthorProfile from '@/views/AuthorProfile';
import { siteMetadata } from '@/lib/metadata';
import { getStaffBySlug } from '@/lib/staff-profiles';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  try {
    const profile = await getStaffBySlug(slug);
    if (!profile || profile.isActive === false) {
      return siteMetadata({ title: 'Author', path: `/authors/${slug}` });
    }
    return siteMetadata({
      title: `${profile.displayName} · ${profile.title || 'Reporter'}`,
      description: profile.bio || `${profile.displayName} writes for The Bharath News.`,
      path: `/authors/${profile.slug}`,
      image: profile.photoURL || undefined,
    });
  } catch {
    return siteMetadata({ title: 'Author', path: `/authors/${slug}` });
  }
}

export default async function AuthorPage({ params }) {
  const { slug } = await params;
  return <AuthorProfile slug={slug} />;
}
