import { siteMetadata } from './metadata';

const CATEGORIES = {
  india: { title: 'India News', keywords: ['India news', 'Indian politics', 'India economy'] },
  gcc: { title: 'GCC News', keywords: ['GCC news', 'Gulf news', 'UAE news', 'Saudi Arabia news', 'Middle East news'] },
  business: { title: 'Business News', keywords: ['business news India', 'stock market', 'economy', 'finance'] },
  technology: { title: 'Technology News', keywords: ['technology news', 'tech India', 'startups', 'AI', 'gadgets'] },
  sports: { title: 'Sports News', keywords: ['sports news India', 'cricket', 'IPL', 'football', 'Olympics'] },
  entertainment: { title: 'Entertainment News', keywords: ['Bollywood', 'entertainment news', 'movies', 'celebrities'] },
  health: { title: 'Health & Wellness', keywords: ['health news', 'wellness', 'medical news India', 'fitness'] },
  education: { title: 'Education News', keywords: ['education news India', 'exams', 'universities', 'scholarships'] },
  jobs: { title: 'Jobs & Careers', keywords: ['jobs India', 'government jobs', 'careers', 'recruitment'] },
  realestate: { title: 'Real Estate', keywords: ['real estate India', 'property news', 'housing market'] },
  'real-estate': { title: 'Real Estate', keywords: ['real estate India', 'property news', 'housing market'] },
  world: { title: 'World News', keywords: ['world news', 'international news', 'global affairs'] },
  lifestyle: { title: 'Lifestyle & Travel', keywords: ['lifestyle', 'travel India', 'food', 'fashion'] },
  opinion: { title: 'Opinion & Editorial', keywords: ['opinion', 'editorial', 'analysis', 'commentary'] },
};

export function categoryMetadata(slug) {
  const cat = CATEGORIES[slug] || { title: 'News', keywords: ['news'] };
  return siteMetadata({
    title: cat.title,
    description: `Latest ${cat.title.toLowerCase()} from The Bharath News. Comprehensive coverage of India, GCC, and world events.`,
    path: `/${slug}`,
    type: 'website',
    keywords: cat.keywords,
  });
}
