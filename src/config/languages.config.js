export const DEFAULT_LANGUAGE = 'en';

export const SUPPORTED_LANGUAGES = [
  { code: 'all', name: 'All Languages', nativeName: 'All Languages', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
];

/** Languages shown in the header switcher (excludes "All Languages"). */
export const SELECTABLE_LANGUAGES = SUPPORTED_LANGUAGES.filter(l => l.code !== 'all');

export const TARGET_TRANSLATION_LANGS = ['ml', 'hi'];

export const REGIONS = {
  india: 'India',
  kerala: 'Kerala',
  gcc: 'GCC',
  uae: 'UAE',
  saudi: 'Saudi Arabia',
  qatar: 'Qatar',
  kuwait: 'Kuwait',
  bahrain: 'Bahrain',
  oman: 'Oman',
  global: 'Global',
};

export function getLanguageByCode(code) {
  const normalized = code && code !== 'all' ? code : DEFAULT_LANGUAGE;
  return SUPPORTED_LANGUAGES.find(l => l.code === normalized)
    || SUPPORTED_LANGUAGES.find(l => l.code === DEFAULT_LANGUAGE);
}

export function normalizeLanguageCode(code) {
  if (!code || code === 'all') return DEFAULT_LANGUAGE;
  return SELECTABLE_LANGUAGES.some(l => l.code === code) ? code : DEFAULT_LANGUAGE;
}

/** Returns language filter value for queries, or null for no filter. */
export function toLanguageFilter(code) {
  return code && code !== 'all' ? code : null;
}

/** @deprecated Use toLanguageFilter */
export const toFirestoreLanguageFilter = toLanguageFilter;
