/** Build href for a nav subcategory link (header dropdown + mobile menu). */
export function buildNavSubcategoryHref(link, subId) {
  if (!subId || subId === 'all') return link?.path || '/';
  if (link?.sectionId === 'top-stories') {
    return `/?sub=${encodeURIComponent(subId)}`;
  }
  const base = link?.path || '/';
  return `${base}?sub=${encodeURIComponent(subId)}`;
}
