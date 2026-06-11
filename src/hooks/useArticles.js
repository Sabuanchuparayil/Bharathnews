import { useState, useEffect, useCallback } from 'react';
import { getArticles, getTrendingArticles, getArticlesByInterests } from '../services/firestore';
import { useAuth } from '../context/AuthContext';

export function useArticles(category = null) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getArticles(category);
      setArticles(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching articles:', err);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  return { articles, loading, error, refetch: fetchArticles };
}

export function useTrendingArticles(count = 5) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrendingArticles(count)
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [count]);

  return { articles, loading };
}

export function useForYouArticles(count = 10) {
  const { userProfile } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const interests = userProfile?.interests || {};
    getArticlesByInterests(interests, count)
      .then(setArticles)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userProfile, count]);

  return { articles, loading };
}
