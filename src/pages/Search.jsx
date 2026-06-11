import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import NewsCard from '../components/NewsCard';
import { getArticles } from '../services/firestore';

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchParams({ q: query });
    setLoading(true);
    try {
      const articles = await getArticles();
      const filtered = articles.filter(a =>
        a.title?.toLowerCase().includes(query.toLowerCase()) ||
        a.summary?.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Search News</h1>
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
          <button type="submit" className="bg-brand-700 text-white px-6 py-3 rounded-lg hover:bg-brand-800 transition-colors flex items-center space-x-2">
            <SearchIcon className="w-5 h-5" />
            <span>Search</span>
          </button>
        </form>
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-6">
            {results.map(article => <NewsCard key={article.id} article={article} />)}
          </div>
        ) : query && !loading ? (
          <p className="text-gray-500 text-center">No articles found for &quot;{query}&quot;</p>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default Search;
