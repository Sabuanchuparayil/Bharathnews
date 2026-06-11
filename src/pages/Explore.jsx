import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Layout from '../components/Layout';
import { CATEGORIES, CATEGORY_ROUTES } from '../config/feeds.config';
import { getCategoryColor } from '../utils/categoryColors';

const Explore = () => {
  const routableCategories = CATEGORIES.filter(
    c => c.id !== 'all' && c.id !== 'breaking' && CATEGORY_ROUTES[c.id]
  );

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Explore Categories | The Bharath News</title>
        <meta name="description" content="Browse all news categories — India, GCC, Sports, Entertainment, Education, Jobs, and more." />
      </Helmet>

      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Explore Categories</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Browse every section of Bharath News — from breaking headlines to lifestyle, jobs, and opinion.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {routableCategories.map(cat => {
          const route = CATEGORY_ROUTES[cat.id];
          return (
            <Link
              key={cat.id}
              to={route.path}
              className="glass-card-solid rounded-2xl p-6 card-lift block group"
            >
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${getCategoryColor(cat.id)}`}>
                {cat.name}
              </span>
              <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {route.title}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Latest stories, videos, and live feeds
              </p>
            </Link>
          );
        })}
      </div>
    </Layout>
  );
};

export default Explore;
