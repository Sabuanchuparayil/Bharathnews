const DECAY_FACTOR = 0.9;
const ACTION_WEIGHTS = {
  read: { category: 0.1, topic: 0.05 },
  read_long: { category: 0.3, topic: 0.2 },
  share: { category: 0.5, topic: 0.3 },
  bookmark: { category: 0.4, topic: 0.2 },
  skip: { category: -0.05, topic: -0.02 },
};

export function updateInterests(currentInterests, article, action) {
  const weights = ACTION_WEIGHTS[action] || ACTION_WEIGHTS.read;
  const updated = { ...currentInterests };

  if (!updated.categories) updated.categories = {};
  if (!updated.topics) updated.topics = [];

  const cat = article.category?.toLowerCase();
  if (cat) {
    updated.categories[cat] = (updated.categories[cat] || 0) + weights.category;
    updated.categories[cat] = Math.min(1, Math.max(0, updated.categories[cat]));
  }

  if (article.topics) {
    article.topics.forEach(topic => {
      if (!updated.topics.includes(topic)) {
        updated.topics = [...updated.topics.slice(-19), topic];
      }
    });
  }

  return updated;
}

export function scoreArticleForUser(article, userInterests) {
  if (!userInterests?.categories) return article.score || 5;

  let interestMatch = 0;
  const cat = article.category?.toLowerCase();
  if (cat && userInterests.categories[cat]) {
    interestMatch += userInterests.categories[cat] * 5;
  }

  if (article.topics && userInterests.topics) {
    const overlap = article.topics.filter(t => userInterests.topics.includes(t));
    interestMatch += overlap.length * 2;
  }

  return (article.score || 5) + interestMatch;
}

export function getTopCategories(interests, count = 3) {
  if (!interests?.categories) return [];
  return Object.entries(interests.categories)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([cat]) => cat);
}

export function applyWeeklyDecay(interests) {
  const decayed = { ...interests };
  if (decayed.categories) {
    Object.keys(decayed.categories).forEach(key => {
      decayed.categories[key] *= DECAY_FACTOR;
      if (decayed.categories[key] < 0.01) delete decayed.categories[key];
    });
  }
  return decayed;
}
