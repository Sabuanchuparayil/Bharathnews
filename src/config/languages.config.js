export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
];

export const TARGET_TRANSLATION_LANGS = ['ml', 'hi', 'ar'];

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

export function isRtl(code) {
  return getLanguageByCode(code).dir === 'rtl';
}
