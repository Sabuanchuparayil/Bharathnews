import { siteMetadata } from './metadata';

const CATEGORIES = {
  india: 'India News',
  gcc: 'GCC News',
  business: 'Business News',
  technology: 'Technology News',
  sports: 'Sports News',
  entertainment: 'Entertainment News',
  health: 'Health & Wellness',
  education: 'Education News',
  jobs: 'Jobs & Careers',
  realestate: 'Real Estate',
  world: 'World News',
  lifestyle: 'Lifestyle & Travel',
  opinion: 'Opinion & Editorial',
};

export function categoryMetadata(slug) {
  const title = CATEGORIES[slug] || 'News';
  return siteMetadata({
    title,
    description: `Latest ${title.toLowerCase()} from The Bharath News. Coverage of India, GCC, business, and technology.`,
    path: `/${slug}`,
    type: 'website',
  });
}
