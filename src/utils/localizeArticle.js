/**
 * Resolve article fields for the selected UI language.
 * Falls back to English canonical fields when translation missing.
 */
export function localizeArticle(article, lang = 'en') {
  if (!article) return article;
  if (lang === 'en' || !lang) {
    return {
      ...article,
      displayTitle: article.title,
      displaySummary: article.summary,
      displayContent: article.fullContent,
      isRtl: false,
    };
  }

  const t = article.translations?.[lang];
  return {
    ...article,
    displayTitle: t?.title || article.title,
    displaySummary: t?.summary || article.summary,
    displayContent: t?.fullContent || article.fullContent,
    isRtl: lang === 'ar',
  };
}

export function localizeArticles(articles, lang = 'en') {
  return articles.map(a => localizeArticle(a, lang));
}
