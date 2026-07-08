/**
 * Interest-first category taxonomy for The Bharath News.
 * Maps legacy flat DB categories to 6 top-level sections + subcategories.
 */

/** @typedef {{ id: string, label: string, legacyCategories?: string[], keywords?: string[], sourceKeywords?: string[] }} SubcategoryDef */
/** @typedef {{ id: string, label: string, shortLabel?: string, path: string, title: string, color: string, description?: string, subcategories: SubcategoryDef[] }} SectionDef */

/** @type {Record<string, SectionDef>} */
export const SECTIONS = {
  'top-stories': {
    id: 'top-stories',
    label: 'Top Stories',
    path: '/',
    title: 'Top Stories',
    color: 'bg-red-100 text-red-700',
    description: 'Breaking news, editor\'s picks, and trending stories',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'breaking', label: 'Breaking', legacyCategories: [], keywords: ['breaking', 'urgent', 'alert'] },
      { id: 'editors-picks', label: "Editor's Picks", keywords: ['exclusive', 'analysis', 'deep dive'] },
      { id: 'most-read', label: 'Most Read' },
      { id: 'for-you', label: 'For You' },
    ],
  },
  money: {
    id: 'money',
    label: 'Money',
    path: '/money',
    title: 'Money & Markets',
    color: 'bg-blue-100 text-blue-700',
    description: 'Markets, business, jobs, real estate, and personal finance',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'markets', label: 'Markets', legacyCategories: ['business'], keywords: ['market', 'stock', 'sensex', 'nifty', 'bse', 'nse', 'trading', 'ipo', 'share'] },
      { id: 'business', label: 'Business', legacyCategories: ['business'], keywords: ['company', 'corporate', 'startup funding', 'merger', 'acquisition'] },
      { id: 'jobs', label: 'Jobs & Careers', legacyCategories: ['jobs'], keywords: ['job', 'hiring', 'career', 'recruitment', 'layoff', 'salary'] },
      { id: 'realestate', label: 'Real Estate', legacyCategories: ['realestate'], keywords: ['property', 'real estate', 'housing', 'rent', 'apartment', 'villa'] },
      { id: 'personal-finance', label: 'Personal Finance', legacyCategories: ['business'], keywords: ['tax', 'insurance', 'mutual fund', 'savings', 'loan', 'credit', 'investment', 'wealth'] },
    ],
  },
  sports: {
    id: 'sports',
    label: 'Sports',
    path: '/sports',
    title: 'Sports',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Cricket, football, motorsport, and more',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'cricket', label: 'Cricket', legacyCategories: ['sports'], keywords: ['cricket', 'ipl', 't20', 'test match', 'odi', 'bcci', 'wicket', 'batsman'] },
      { id: 'football', label: 'Football', legacyCategories: ['sports'], keywords: ['football', 'soccer', 'premier league', 'fifa', 'uefa', 'goal', 'messi', 'ronaldo'] },
      { id: 'motorsport', label: 'Motorsport', legacyCategories: ['sports'], keywords: ['f1', 'formula', 'motogp', 'racing', 'grand prix', 'verstappen', 'hamilton'] },
      { id: 'olympics', label: 'Olympics', legacyCategories: ['sports'], keywords: ['olympic', 'olympics', 'medal', 'commonwealth'] },
      { id: 'other', label: 'Other Sports', legacyCategories: ['sports'] },
    ],
  },
  tech: {
    id: 'tech',
    label: 'Tech',
    shortLabel: 'Tech & Science',
    path: '/tech',
    title: 'Tech & Science',
    color: 'bg-purple-100 text-purple-700',
    description: 'Startups, AI, gadgets, and space',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'startups', label: 'Startups', legacyCategories: ['technology'], keywords: ['startup', 'unicorn', 'funding', 'venture', 'seed round'] },
      { id: 'ai-tech', label: 'AI & Tech', legacyCategories: ['technology'], keywords: ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'software', 'tech'] },
      { id: 'gadgets', label: 'Gadgets', legacyCategories: ['technology'], keywords: ['iphone', 'android', 'smartphone', 'laptop', 'gadget', 'device', 'apple', 'samsung'] },
      { id: 'space-science', label: 'Space & Science', legacyCategories: ['technology', 'health'], keywords: ['space', 'nasa', 'isro', 'rocket', 'satellite', 'science', 'research', 'study'] },
    ],
  },
  life: {
    id: 'life',
    label: 'Life',
    path: '/life',
    title: 'Life & Culture',
    color: 'bg-rose-100 text-rose-700',
    description: 'Health, education, entertainment, travel, and opinion',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'health', label: 'Health', legacyCategories: ['health'], keywords: ['health', 'medical', 'doctor', 'hospital', 'disease', 'wellness', 'fitness'] },
      { id: 'education', label: 'Education', legacyCategories: ['education'], keywords: ['education', 'school', 'university', 'exam', 'student', 'college', 'neet', 'jee'] },
      { id: 'entertainment', label: 'Entertainment', legacyCategories: ['entertainment'], keywords: ['bollywood', 'movie', 'film', 'actor', 'celebrity', 'music', 'ott', 'netflix'] },
      { id: 'food-travel', label: 'Food & Travel', legacyCategories: ['lifestyle'], keywords: ['travel', 'food', 'recipe', 'restaurant', 'tourism', 'hotel', 'vacation'] },
      { id: 'opinion', label: 'Opinion', legacyCategories: ['opinion'], keywords: ['opinion', 'editorial', 'column', 'commentary', 'perspective'] },
    ],
  },
  world: {
    id: 'world',
    label: 'World',
    path: '/world',
    title: 'World News',
    color: 'bg-violet-100 text-violet-700',
    description: 'India, Gulf & Middle East, global news, and diaspora stories',
    subcategories: [
      { id: 'all', label: 'All' },
      { id: 'india', label: 'India', legacyCategories: ['india'], keywords: ['india', 'delhi', 'mumbai', 'modi', 'parliament', 'kerala', 'tamil nadu'] },
      { id: 'gulf', label: 'Gulf & Middle East', legacyCategories: ['gcc'], keywords: ['uae', 'dubai', 'saudi', 'qatar', 'gcc', 'gulf', 'oman', 'bahrain', 'kuwait'] },
      { id: 'global', label: 'Global', legacyCategories: ['world'], keywords: ['world', 'global', 'international', 'united nations', 'europe', 'america', 'china'] },
      { id: 'diaspora', label: 'Diaspora', legacyCategories: ['india', 'gcc', 'world'], keywords: ['diaspora', 'expat', 'nri', 'indian abroad', 'overseas indian', 'remittance', 'immigrant'] },
    ],
  },
};

/** Primary header navigation — 6 top-level sections + marketplace */
export const HEADER_NAV = [
  { path: '/', label: 'Top Stories', sectionId: 'top-stories' },
  { path: '/money', label: 'Money', sectionId: 'money' },
  { path: '/sports', label: 'Sports', sectionId: 'sports' },
  { path: '/tech', label: 'Tech', sectionId: 'tech' },
  { path: '/life', label: 'Life', sectionId: 'life' },
  { path: '/world', label: 'World', sectionId: 'world' },
  { path: '/jobs', label: 'Jobs', sectionId: null },
  { path: '/classifieds', label: 'Classifieds', sectionId: null },
];

/** Mobile bottom nav */
export const BOTTOM_NAV = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/explore', label: 'Discover', icon: 'compass' },
  { path: '/sports', label: 'Sports', icon: 'trophy' },
  { path: '/money', label: 'Money', icon: 'wallet' },
  { path: '/settings', label: 'Profile', icon: 'user' },
];

/** Map legacy DB category → parent section id */
export const LEGACY_TO_SECTION = {
  india: 'world',
  gcc: 'world',
  business: 'money',
  technology: 'tech',
  sports: 'sports',
  entertainment: 'life',
  health: 'life',
  education: 'life',
  jobs: 'money',
  realestate: 'money',
  lifestyle: 'life',
  opinion: 'life',
  world: 'world',
  breaking: 'top-stories',
};

/** Map legacy category → default subcategory within its section */
export const LEGACY_TO_SUBCATEGORY = {
  india: 'india',
  gcc: 'gulf',
  business: 'business',
  technology: 'ai-tech',
  sports: 'other',
  entertainment: 'entertainment',
  health: 'health',
  education: 'education',
  jobs: 'jobs',
  realestate: 'realestate',
  lifestyle: 'food-travel',
  opinion: 'opinion',
  world: 'global',
};

/** Legacy flat categories still routable at old URLs */
export const CATEGORY_ROUTES = {
  india: { path: '/india', title: 'India News', sectionId: 'world', subcategoryId: 'india' },
  gcc: { path: '/gcc', title: 'GCC News', sectionId: 'world', subcategoryId: 'gulf' },
  business: { path: '/business', title: 'Business News', sectionId: 'money', subcategoryId: 'business' },
  technology: { path: '/technology', title: 'Technology News', sectionId: 'tech', subcategoryId: 'ai-tech' },
  sports: { path: '/sports', title: 'Sports News', sectionId: 'sports' },
  entertainment: { path: '/entertainment', title: 'Entertainment News', sectionId: 'life', subcategoryId: 'entertainment' },
  health: { path: '/health', title: 'Health & Wellness', sectionId: 'life', subcategoryId: 'health' },
  education: { path: '/education', title: 'Education News', sectionId: 'life', subcategoryId: 'education' },
  jobs: { path: '/jobs', title: 'Jobs & Careers', sectionId: 'money', subcategoryId: 'jobs' },
  realestate: { path: '/real-estate', title: 'Real Estate', sectionId: 'money', subcategoryId: 'realestate' },
  lifestyle: { path: '/lifestyle', title: 'Lifestyle & Travel', sectionId: 'life', subcategoryId: 'food-travel' },
  opinion: { path: '/opinion', title: 'Opinion & Editorial', sectionId: 'life', subcategoryId: 'opinion' },
  world: { path: '/world', title: 'World News', sectionId: 'world' },
};

/** Section-level routes (new taxonomy) */
export const SECTION_ROUTES = Object.fromEntries(
  Object.values(SECTIONS).map(s => [s.id, { path: s.path, title: s.title, label: s.label }])
);

/** Subcategories keyed by section id */
export const SUBCATEGORIES = Object.fromEntries(
  Object.values(SECTIONS).map(s => [s.id, s.subcategories])
);

/** Flat category list for filters — legacy + special */
export const CATEGORIES = [
  { id: 'all', name: 'All News', color: 'bg-gray-100 text-gray-700' },
  { id: 'breaking', name: 'Breaking', color: 'bg-red-100 text-red-700' },
  { id: 'india', name: 'India', color: 'bg-orange-100 text-orange-700' },
  { id: 'gcc', name: 'GCC', color: 'bg-green-100 text-green-700' },
  { id: 'business', name: 'Business', color: 'bg-blue-100 text-blue-700' },
  { id: 'technology', name: 'Technology', color: 'bg-purple-100 text-purple-700' },
  { id: 'sports', name: 'Sports', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'entertainment', name: 'Entertainment', color: 'bg-pink-100 text-pink-700' },
  { id: 'health', name: 'Health', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'education', name: 'Education', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'jobs', name: 'Jobs', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'realestate', name: 'Real Estate', color: 'bg-amber-100 text-amber-700' },
  { id: 'lifestyle', name: 'Lifestyle', color: 'bg-rose-100 text-rose-700' },
  { id: 'opinion', name: 'Opinion', color: 'bg-slate-100 text-slate-700' },
  { id: 'world', name: 'World', color: 'bg-violet-100 text-violet-700' },
];

/** Sections shown on homepage browse zone */
export const HOME_SECTION_IDS = ['money', 'sports', 'tech', 'life', 'world'];

/** Primary categories for compact home filter */
export const HOME_CATEGORY_IDS = ['all', 'breaking', 'money', 'sports', 'tech', 'life', 'world'];

export function getSection(sectionId) {
  return SECTIONS[sectionId] || null;
}

export function getSectionForPath(pathname) {
  if (pathname === '/') return SECTIONS['top-stories'];
  const section = Object.values(SECTIONS).find(s => s.path !== '/' && pathname.startsWith(s.path));
  if (section) return section;
  const legacy = Object.entries(CATEGORY_ROUTES).find(([, r]) => r.path === pathname);
  if (legacy) {
    const [, route] = legacy;
    return route.sectionId ? SECTIONS[route.sectionId] : null;
  }
  return null;
}

export function getSectionForLegacyCategory(category) {
  return LEGACY_TO_SECTION[category] || null;
}

/** All legacy DB categories that belong to a section (optionally filtered by subcategory) */
export function getLegacyCategoriesForSection(sectionId, subcategoryId = 'all') {
  if (sectionId === 'top-stories') return null;

  const section = SECTIONS[sectionId];
  if (!section) return [];

  if (!subcategoryId || subcategoryId === 'all') {
    const cats = new Set();
    for (const sub of section.subcategories) {
      if (sub.legacyCategories) sub.legacyCategories.forEach(c => cats.add(c));
    }
    if (cats.size === 0) {
      Object.entries(LEGACY_TO_SECTION).forEach(([legacy, sec]) => {
        if (sec === sectionId) cats.add(legacy);
      });
    }
    return [...cats];
  }

  const sub = section.subcategories.find(s => s.id === subcategoryId);
  if (sub?.legacyCategories?.length) return sub.legacyCategories;

  const mapped = Object.entries(LEGACY_TO_SUBCATEGORY)
    .filter(([, subId]) => subId === subcategoryId)
    .map(([legacy]) => legacy);
  return mapped.length ? mapped : getLegacyCategoriesForSection(sectionId, 'all');
}

export function getSubcategoriesForSection(sectionId) {
  return SUBCATEGORIES[sectionId] || [];
}

export function getHomeCategories() {
  return HOME_CATEGORY_IDS.map(id => {
    if (id === 'all') return CATEGORIES.find(c => c.id === 'all');
    if (id === 'breaking') return CATEGORIES.find(c => c.id === 'breaking');
    const section = SECTIONS[id];
    if (section) return { id: section.id, name: section.label, color: section.color };
    return CATEGORIES.find(c => c.id === id);
  }).filter(Boolean);
}

/** Resolve section + subcategory from legacy category id */
export function resolveLegacyCategory(category) {
  const sectionId = LEGACY_TO_SECTION[category];
  const subcategoryId = LEGACY_TO_SUBCATEGORY[category] || 'all';
  return { sectionId, subcategoryId };
}
