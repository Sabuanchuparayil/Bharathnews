const SITE_ORIGIN = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://thebharathnews.com';

export const buildShareUrl = (path, contentType = 'content') => {
  const base = path.startsWith('http') ? path : `${SITE_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}utm_source=share&utm_medium=social&utm_campaign=${contentType}`;
};

export const getSocialShareUrls = ({ title, text, url }) => {
  const message = text ? `${title} — ${text}` : title;
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${message}\n${url}`)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };
};

export const shareNative = async ({ title, text, url }) => {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title, text: text || title, url });
    return true;
  } catch (err) {
    if (err?.name === 'AbortError') return null;
    return false;
  }
};

export const copyShareUrl = async (url) => {
  await navigator.clipboard.writeText(url);
};

export const openShareWindow = (shareUrl) => {
  window.open(shareUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
};
