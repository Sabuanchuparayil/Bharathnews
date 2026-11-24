/** English and Malayalam, decided from the letters actually in the text. */

export function detectPublicationLang(text) {
  const sample = String(text || '');
  const malayalam = (sample.match(/[\u0D00-\u0D7F]/g) || []).length;
  const latin = (sample.match(/[A-Za-z]/g) || []).length;
  if (malayalam >= 8 && malayalam > latin) return 'ml';
  if (latin >= 8 && latin >= malayalam) return 'en';
  return '';
}

export function translationMatchesTarget(title, fullContent, targetLang) {
  if (targetLang !== 'en' && targetLang !== 'ml') return true;
  const detected = detectPublicationLang(`${title || ''}\n${fullContent || ''}`);
  return detected === targetLang;
}
