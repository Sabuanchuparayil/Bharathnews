export const slugify = (text) =>
  (text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export const generateUsername = (displayName, email) => {
  const base = slugify(displayName) || slugify((email || '').split('@')[0]) || 'creator';
  return base;
};
