/** Pass-through — content is shown in its native language; no UI translation. */
export function localizeArticle(article) {
  if (!article) return article;
  return {
    ...article,
    displayTitle: article.title,
    displaySummary: article.summary,
    displayContent: article.fullContent,
  };
}

export function localizeArticles(articles) {
  return articles.map(a => localizeArticle(a));
}
