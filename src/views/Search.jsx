'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import Layout from '../components/Layout';
import NewsCard from '../components/NewsCard';
import EmptyState from '../components/EmptyState';
import { searchArticles } from '../services/articles';
import { useLanguage } from '../context/LanguageContext';
import { toFirestoreLanguageFilter } from '@/config/languages.config';

const Search = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const langFilter = toFirestoreLanguageFilter(language);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const filtered = await searchArticles(q.trim(), 30, langFilter);
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    }
    setLoading(false);
  }, [langFilter]);

  const debounceReady = useRef(false);

  useEffect(() => {
    const delay = debounceReady.current ? 400 : 0;
    debounceReady.current = true;

    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        const trimmed = query.trim();
        if (searchParams.get('q') !== trimmed) {
          router.replace(`/search?q=${encodeURIComponent(trimmed)}`);
        }
        runSearch(trimmed);
      } else if (!query.trim()) {
        setResults([]);
        setSearched(false);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [query, runSearch, router, searchParams, langFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.replace(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query.trim());
  };

  return (
    <Layout mainClassName="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Search News</h1>
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics, categories..."
          aria-label="Search articles"
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary flex items-center space-x-2 px-6" disabled={loading}>
          <SearchIcon className="w-5 h-5" />
          <span>{loading ? 'Searching...' : 'Search'}</span>
        </button>
      </form>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass-card-solid rounded-2xl overflow-hidden">
              <div className="h-32 skeleton" />
            </div>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;</p>
          {results.map((article, i) => <NewsCard key={article.id} article={article} index={i} />)}
        </div>
      ) : searched && !loading ? (
        <EmptyState
          icon={SearchIcon}
          title="No results found"
          description={`We couldn't find any articles matching "${query}". Try different keywords.`}
          actionLabel="Browse All News"
          actionTo="/"
        />
      ) : null}
    </Layout>
  );
};

export default Search;
