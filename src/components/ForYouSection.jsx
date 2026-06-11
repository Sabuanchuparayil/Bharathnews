import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getArticlesByInterests } from '../services/firestore';

const ForYouSection = () => {
  const { user, userProfile } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);

  const hasInterests = userProfile?.interests?.categories &&
    Object.keys(userProfile.interests.categories).length > 0;

  useEffect(() => {
    if (!user || !userProfile?.interests) return;
    setLoading(true);
    getArticlesByInterests(userProfile.interests, 8)
      .then(setArticles)
      .finally(() => setLoading(false));
  }, [user, userProfile]);

  if (!user) return null;

  if (!hasInterests && !loading) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="glass-card-solid rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-accent-amber" />
              <div>
                <h2 className="font-display font-bold text-base text-gray-900 dark:text-white">Personalize your feed</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select your interests to see tailored stories here.</p>
              </div>
            </div>
            <Link to="/settings" className="btn-primary text-sm flex items-center space-x-1">
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (loading) return null;

  if (hasInterests && articles.length === 0) {
    return (
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent-amber" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">For You</h2>
          </div>
          <div className="glass-card-solid rounded-2xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400">We're curating stories based on your interests. Check back soon!</p>
            <Link to="/settings" className="text-brand-600 dark:text-brand-400 text-sm font-medium mt-2 inline-block hover:text-brand-700 transition-colors">Update interests</Link>
          </div>
        </div>
      </section>
    );
  }

  if (!articles.length) return null;

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
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
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
