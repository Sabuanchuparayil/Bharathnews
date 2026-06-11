'use client';

export const trackPageView = (pageName) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'page_view', { page_title: pageName });
  }
};

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
};

export const trackArticleClick = (articleId, title) => {
  trackEvent('article_click', { article_id: articleId, article_title: title });
};

export const trackShare = (articleId, platform) => {
  trackEvent('share', { article_id: articleId, platform });
};
