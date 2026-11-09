/** Curated cover photos already used as news art. Keyword search stays local and free. */

export const IMAGE_CATALOG = [
  { url: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&h=450&fit=crop&crop=center', tags: 'news desk papers journalism india', label: 'News desk' },
  { url: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=450&fit=crop&crop=center', tags: 'newspaper press media', label: 'Newspaper' },
  { url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&h=450&fit=crop&crop=center', tags: 'press conference politics india', label: 'Press' },
  { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&crop=center', tags: 'business office finance money', label: 'Office' },
  { url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&h=450&fit=crop&crop=center', tags: 'india delhi monument', label: 'India' },
  { url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop&crop=center', tags: 'dubai uae gulf gcc skyline', label: 'Dubai' },
  { url: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&h=450&fit=crop&crop=center', tags: 'dubai marina gulf night uae', label: 'Gulf night' },
  { url: 'https://images.unsplash.com/photo-1532664189809-02133fee698d?w=800&h=450&fit=crop&crop=center', tags: 'kerala backwaters india water', label: 'Kerala water' },
  { url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&crop=center', tags: 'markets stocks business money gold', label: 'Markets' },
  { url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop&crop=center', tags: 'technology chips tech computer', label: 'Technology' },
  { url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=450&fit=crop&crop=center', tags: 'football sports stadium', label: 'Football' },
  { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=450&fit=crop&crop=center', tags: 'world earth space science', label: 'World' },
  { url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=450&fit=crop&crop=center', tags: 'travel gulf airport nri', label: 'Travel' },
  { url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=450&fit=crop&crop=center', tags: 'cyber technology security', label: 'Security' },
  { url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&crop=center', tags: 'business charts money finance', label: 'Charts' },
  { url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=450&fit=crop&crop=center', tags: 'entertainment concert music', label: 'Concert' },
  { url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=450&fit=crop&crop=center', tags: 'real estate house property', label: 'Property' },
  { url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=450&fit=crop&crop=center', tags: 'laptop technology coding', label: 'Laptop' },
  { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=450&fit=crop&crop=center', tags: 'education school children books', label: 'School' },
  { url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=450&fit=crop&crop=center', tags: 'home real estate villa gulf', label: 'Villa' },
  { url: 'https://images.unsplash.com/photo-1504465039710-0f49c0a47eb7?w=800&h=450&fit=crop&crop=center', tags: 'health hospital medical', label: 'Health' },
  { url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=450&fit=crop&crop=center', tags: 'entertainment crowd festival onam', label: 'Festival' },
  { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&h=450&fit=crop&crop=center', tags: 'education students campus', label: 'Campus' },
  { url: 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=800&h=450&fit=crop&crop=center', tags: 'cricket sports ball', label: 'Cricket' },
  { url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=450&fit=crop&crop=center', tags: 'cycling sports fitness', label: 'Sport' },
];

const CATEGORY_TAGS = {
  gcc: 'gulf dubai uae',
  india: 'india kerala',
  business: 'business money markets',
  technology: 'technology',
  sports: 'sports cricket',
  entertainment: 'entertainment',
  health: 'health',
  education: 'education',
  jobs: 'business office',
  realestate: 'real estate property',
  lifestyle: 'travel festival',
  opinion: 'news',
  world: 'world',
};

function withCredit(item) {
  const joiner = item.url.includes('?') ? '&' : '?';
  return {
    url: item.url.includes('editorial=1') ? item.url : `${item.url}${joiner}editorial=1`,
    thumb: item.url,
    label: item.label,
    credit: 'Photo: Unsplash',
  };
}

export function searchImageCatalog({ query = '', category = '', offset = 0, limit = 8 } = {}) {
  const terms = `${query} ${CATEGORY_TAGS[category] || category}`.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const ranked = IMAGE_CATALOG.map((item, index) => {
    const hay = `${item.tags} ${item.label}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + (hay.includes(term) ? 2 : 0), 0);
    return { item, score, index };
  }).sort((a, b) => b.score - a.score || a.index - b.index);

  const start = Math.max(0, offset) % Math.max(ranked.length, 1);
  const page = [];
  for (let i = 0; i < Math.min(limit, ranked.length); i += 1) {
    page.push(ranked[(start + i) % ranked.length].item);
  }
  return page.map(withCredit);
}
