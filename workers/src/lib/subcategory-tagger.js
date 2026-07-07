/**
 * Infer subcategory tags during RSS ingest (mirrors frontend category-taxonomy.js).
 */

const SUBCATEGORIES = {
  money: [
    { id: 'markets', legacyCategories: ['business'], keywords: ['market', 'stock', 'sensex', 'nifty', 'bse', 'nse', 'trading', 'ipo', 'share'] },
    { id: 'business', legacyCategories: ['business'], keywords: ['company', 'corporate', 'merger', 'acquisition'] },
    { id: 'jobs', legacyCategories: ['jobs'], keywords: ['job', 'hiring', 'career', 'recruitment', 'layoff', 'salary'] },
    { id: 'realestate', legacyCategories: ['realestate'], keywords: ['property', 'real estate', 'housing', 'rent', 'apartment'] },
    { id: 'personal-finance', legacyCategories: ['business'], keywords: ['tax', 'insurance', 'mutual fund', 'savings', 'loan', 'credit', 'investment', 'wealth'] },
  ],
  sports: [
    { id: 'cricket', legacyCategories: ['sports'], keywords: ['cricket', 'ipl', 't20', 'test match', 'odi', 'bcci', 'wicket'] },
    { id: 'football', legacyCategories: ['sports'], keywords: ['football', 'soccer', 'premier league', 'fifa', 'uefa', 'goal'] },
    { id: 'motorsport', legacyCategories: ['sports'], keywords: ['f1', 'formula', 'motogp', 'racing', 'grand prix'] },
    { id: 'olympics', legacyCategories: ['sports'], keywords: ['olympic', 'olympics', 'medal', 'commonwealth'] },
    { id: 'other', legacyCategories: ['sports'] },
  ],
  tech: [
    { id: 'startups', legacyCategories: ['technology'], keywords: ['startup', 'unicorn', 'funding', 'venture', 'seed round'] },
    { id: 'ai-tech', legacyCategories: ['technology'], keywords: ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'software'] },
    { id: 'gadgets', legacyCategories: ['technology'], keywords: ['iphone', 'android', 'smartphone', 'laptop', 'gadget', 'device'] },
    { id: 'space-science', legacyCategories: ['technology', 'health'], keywords: ['space', 'nasa', 'isro', 'rocket', 'satellite', 'science', 'research'] },
  ],
  life: [
    { id: 'health', legacyCategories: ['health'], keywords: ['health', 'medical', 'doctor', 'hospital', 'disease', 'wellness'] },
    { id: 'education', legacyCategories: ['education'], keywords: ['education', 'school', 'university', 'exam', 'student', 'college'] },
    { id: 'entertainment', legacyCategories: ['entertainment'], keywords: ['bollywood', 'movie', 'film', 'actor', 'celebrity', 'music', 'ott'] },
    { id: 'food-travel', legacyCategories: ['lifestyle'], keywords: ['travel', 'food', 'recipe', 'restaurant', 'tourism', 'hotel'] },
    { id: 'opinion', legacyCategories: ['opinion'], keywords: ['opinion', 'editorial', 'column', 'commentary'] },
  ],
  world: [
    { id: 'india', legacyCategories: ['india'], keywords: ['india', 'delhi', 'mumbai', 'modi', 'parliament', 'kerala'] },
    { id: 'gulf', legacyCategories: ['gcc'], keywords: ['uae', 'dubai', 'saudi', 'qatar', 'gcc', 'gulf', 'oman', 'bahrain'] },
    { id: 'global', legacyCategories: ['world'], keywords: ['world', 'global', 'international', 'united nations', 'europe'] },
    { id: 'diaspora', legacyCategories: ['india', 'gcc', 'world'], keywords: ['diaspora', 'expat', 'nri', 'indian abroad', 'overseas indian', 'remittance'] },
  ],
};

const LEGACY_TO_SUBCATEGORY = {
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

const SOURCE_SUBCATEGORY_HINTS = {
  'ET Markets': 'markets',
  'ET Jobs': 'jobs',
  'ET Real Estate': 'realestate',
  'ESPN Cricinfo': 'cricket',
  'TechCrunch': 'startups',
  'The Verge': 'gadgets',
  'The Hindu Health': 'health',
  'The Hindu Education': 'education',
  'The Hindu Opinion': 'opinion',
  'The Hindu Lifestyle': 'food-travel',
  'Arab News': 'gulf',
  'Saudi Gazette': 'gulf',
  'Doha News': 'gulf',
  'Al Jazeera': 'gulf',
  'Gulf News': 'gulf',
  'The National': 'gulf',
  'Google News Saudi': 'gulf',
  'Google News Kuwait': 'gulf',
  'Google News Bahrain': 'gulf',
  'Google News Oman': 'gulf',
  'GN Gulf News': 'gulf',
  'GN Khaleej Times': 'gulf',
  'BBC World': 'global',
  'BBC India': 'india',
  'Google News India EN': 'india',
  'Google News Diaspora': 'diaspora',
  'Google News Gulf': 'gulf',
  'Google News Cricket': 'cricket',
  'Google News Football': 'football',
  'Google News Markets': 'markets',
  'Google News Jobs': 'jobs',
  'Google News Personal Finance': 'personal-finance',
  'Google News AI': 'ai-tech',
  'Google News Space': 'space-science',
  'Google News Startups': 'startups',
  'The Hindu Business': 'business',
  'Economic Times': 'business',
  'TOI Tech': 'ai-tech',
  'HT Entertainment': 'entertainment',
  'The Hindu Entertainment': 'entertainment',
  'TOI Entertainment': 'entertainment',
  'TOI Education': 'education',
  'TOI Lifestyle': 'food-travel',
  'The Hindu Sports': 'other',
  'TOI Sports': 'other',
};

function sectionForCategory(category) {
  if (['india', 'gcc', 'world'].includes(category)) return 'world';
  if (['business', 'jobs', 'realestate'].includes(category)) return 'money';
  if (category === 'technology') return 'tech';
  if (category === 'sports') return 'sports';
  if (['health', 'education', 'entertainment', 'lifestyle', 'opinion'].includes(category)) return 'life';
  return null;
}

function matchesKeywords(text, keywords = []) {
  if (!keywords.length) return false;
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

/**
 * @param {{ title?: string, description?: string, category?: string, source?: string }} article
 * @returns {string|null}
 */
export function inferSubcategoryTag(article) {
  const { title = '', description = '', category = 'india', source = '' } = article;

  if (SOURCE_SUBCATEGORY_HINTS[source]) {
    return SOURCE_SUBCATEGORY_HINTS[source];
  }

  const text = `${title} ${description} ${source}`;
  const sectionId = sectionForCategory(category);
  if (!sectionId) return LEGACY_TO_SUBCATEGORY[category] || null;

  const subs = SUBCATEGORIES[sectionId] || [];
  for (const sub of subs) {
    if (sub.id === 'other') continue;
    if (sub.legacyCategories?.includes(category) && !sub.keywords?.length) {
      return sub.id;
    }
    if (sub.keywords?.length && matchesKeywords(text, sub.keywords)) {
      return sub.id;
    }
  }

  return LEGACY_TO_SUBCATEGORY[category] || null;
}

/** Map feed source config to expected subcategory */
export function subcategoryFromFeed(feed) {
  if (feed.subcategory) return feed.subcategory;
  if (SOURCE_SUBCATEGORY_HINTS[feed.name]) return SOURCE_SUBCATEGORY_HINTS[feed.name];
  return inferSubcategoryTag({
    title: '',
    description: '',
    category: feed.category,
    source: feed.name,
  });
}
