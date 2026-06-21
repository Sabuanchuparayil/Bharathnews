import { CATEGORIES } from '../config/feeds.config';

const COLOR_MAP = {
  'bg-gray-100 text-gray-700': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'bg-red-100 text-red-700': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  'bg-orange-100 text-orange-700': 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  'bg-green-100 text-green-700': 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  'bg-blue-100 text-blue-700': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'bg-purple-100 text-purple-700': 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  'bg-yellow-100 text-yellow-700': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  'bg-violet-100 text-violet-700': 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'bg-pink-100 text-pink-700': 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
  'bg-emerald-100 text-emerald-700': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'bg-cyan-100 text-cyan-700': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  'bg-indigo-100 text-indigo-700': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  'bg-amber-100 text-amber-700': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'bg-rose-100 text-rose-700': 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  'bg-slate-100 text-slate-700': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const categoryLookup = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
const categoryNameLookup = Object.fromEntries(CATEGORIES.map(c => [c.name.toLowerCase(), c]));

const CATEGORY_ALIASES = {
  'real-estate': 'realestate',
  real_estate: 'realestate',
};

function normalizeCategoryKey(category) {
  const raw = (category || '').toLowerCase().trim();
  return CATEGORY_ALIASES[raw] || raw.replace(/[\s_-]+/g, '');
}

export const getCategoryLabel = (category) => {
  const raw = (category || '').toLowerCase().trim();
  const key = normalizeCategoryKey(category);
  const cat = categoryLookup[key] || categoryNameLookup[raw];
  if (cat?.name) return cat.name;
  if (!category) return 'News';
  if (raw === 'gcc') return 'GCC';
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export const getCategoryColor = (category) => {
  const key = normalizeCategoryKey(category);
  const cat = categoryLookup[key] || categoryNameLookup[(category || '').toLowerCase().trim()];
  if (!cat?.color) return 'bg-brand-100 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300';
  return COLOR_MAP[cat.color] || cat.color;
};

export const getCategoryAccentBorder = (category) => {
  const key = normalizeCategoryKey(category);
  const borders = {
    india: 'border-l-orange-500',
    gcc: 'border-l-green-500',
    business: 'border-l-blue-500',
    technology: 'border-l-purple-500',
    sports: 'border-l-yellow-500',
    entertainment: 'border-l-pink-500',
    health: 'border-l-emerald-500',
    education: 'border-l-cyan-500',
    jobs: 'border-l-indigo-500',
    realestate: 'border-l-amber-500',
    lifestyle: 'border-l-rose-500',
    opinion: 'border-l-slate-500',
    breaking: 'border-l-red-500',
    world: 'border-l-violet-500',
    money: 'border-l-blue-500',
    tech: 'border-l-purple-500',
    life: 'border-l-rose-500',
    'top-stories': 'border-l-red-500',
  };
  return borders[key] || 'border-l-brand-500';
};

/** Tailwind classes for category filter pills — colored inactive + highlighted active. */
export const getCategoryPillClasses = (categoryId, isActive) => {
  if (categoryId === 'all') {
    return isActive
      ? 'category-pill-active'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700';
  }

  const color = getCategoryColor(categoryId);
  if (isActive) {
    return `${color} ring-2 ring-offset-1 ring-offset-white dark:ring-offset-dark-surface-0 ring-current/25 font-semibold shadow-sm`;
  }
  return `${color} opacity-90 hover:opacity-100`;
};
