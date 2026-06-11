import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getArticlesByInterests } from '../services/firestore';

const ForYouSection = () => {
  const { user, userProfile } = useAuth();
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    if (userProfile?.interests) {
      getArticlesByInterests(userProfile.interests, 8).then(setArticles);
    }
  }, [userProfile]);

  if (!user || !articles.length) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-5 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-accent-amber" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">For You</h2>
        </div>
        <Link to="/settings" className="flex items-center space-x-1 text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors">
          <span>Customize</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 pb-4">
        {articles.map((article, index) => (
          <motion.div
            key={article.id || index}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            className="flex-shrink-0 w-64"
          >
            <Link to={`/article/${article.slug}`} className="block glass-card-solid rounded-2xl overflow-hidden group">
              <div className="relative h-36 overflow-hidden">
                <img src={article.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-bold uppercase bg-white/90 dark:bg-dark-surface-1/90 backdrop-blur-sm px-2 py-0.5 rounded-md text-brand-700 dark:text-brand-300">{article.category}</span>
                </div>
              </div>
              <div className="p-3.5">
                <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-700 dark:group-hover:text-brand-300 transition-colors">{article.title}</h3>
                <p className="text-xs text-gray-400 mt-2">{article.source || article.author}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ForYouSection;
