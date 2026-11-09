/** Public URL for a published Pravasi Jaalakam piece. */

export function pravasiPublicPath(post) {
  if (!post) return '/pravasi';
  const author = post.authorSlug || post.author_slug || '';
  const slug = post.slug || '';
  if (author && slug) return `/pravasi/${author}-${slug}`;
  if (slug) return `/pravasi/${slug}`;
  return `/pravasi/${post.id || ''}`;
}
