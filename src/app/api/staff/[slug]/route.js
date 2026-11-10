import { NextResponse } from 'next/server';
import {
  getStaffBySlug,
  listArticlesByAuthorSlug,
  toPublicStaffProfile,
} from '@/lib/staff-profiles';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const { slug } = await params;
  try {
    const profile = await getStaffBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: 'Author not found.' }, { status: 404 });
    }
    // Inactive profiles stay readable so published bylines do not 404.
    const articles = await listArticlesByAuthorSlug(profile.slug);
    return NextResponse.json({ profile: toPublicStaffProfile(profile), articles });
  } catch (err) {
    return NextResponse.json(
      { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Could not load author.') },
      { status: 500 },
    );
  }
}
