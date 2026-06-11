import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getArticles } from '../services/firestore';

const ArticleRelated = ({ category, currentSlug }) => {
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!category) return;
    getArticles(category)
      .then(articles => {
        setRelated(articles.filter(a => a.slug !== currentSlug).slice(0, 6));
      })
      .catch(() => setRelated([]));
  }, [category, currentSlug]);

  if (!related.length) return null;

  return (
    <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Related Stories</h2>
        <Link
          to={`/${category}`}
          className="flex items-center space-x-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
        >
          <span>More</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {related.map(article => (
          <Link
            key={article.id}
            to={`/article/${article.slug}`}
            className="flex-shrink-0 w-56 glass-card-solid rounded-2xl overflow-hidden group"
          >
            <div className="relative h-32 overflow-hidden">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="p-3.5">
              <span className="text-[10px] font-bold uppercase text-brand-600 dark:text-brand-400">
                {article.category}
              </span>
              <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 mt-1 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">
                {article.title}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default ArticleRelated;
