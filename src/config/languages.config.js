export const SUPPORTED_LANGUAGES = [
  { code: 'all', name: 'All Languages', nativeName: 'All Languages', dir: 'ltr' },
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
];

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
  return SUPPORTED_LANGUAGES.find(l => l.code === code) || SUPPORTED_LANGUAGES[0];
}

/** Returns Firestore language filter value, or null for no filter. */
export function toFirestoreLanguageFilter(code) {
  return code && code !== 'all' ? code : null;
}
