'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import NewsCard from './NewsCard';
import { SECTIONS, HOME_SECTION_IDS } from '../config/feeds.config';
import { getSectionPreviewArticles } from '../services/articles';

const SectionPreviews = ({ language = null }) => {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all(
      HOME_SECTION_IDS.map(async (sectionId) => {
        const articles = await getSectionPreviewArticles(sectionId, 3, language);
        return { sectionId, articles };
      })
    ).then(results => {
      setSections(results.filter(r => r.articles.length > 0));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [language]);

  if (loading) {
    return (
      <div className="space-y-10">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 skeleton w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((__, j) => (
                <div key={j} className="h-48 skeleton rounded-2xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!sections.length) return null;

  return (
    <div className="space-y-10">
      {sections.map(({ sectionId, articles }) => {
        const section = SECTIONS[sectionId];
        if (!section) return null;
        return (
          <section key={sectionId} aria-labelledby={`section-${sectionId}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 id={`section-${sectionId}`} className="font-display font-bold text-xl text-gray-900 dark:text-white">
                  {section.label}
                </h2>
                {section.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</p>
                )}
              </div>
              <Link
                href={section.path}
                className="flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors"
              >
                See all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((article, index) => (
                <NewsCard key={article.id || article.slug} article={article} variant={index === 0 ? 'featured' : 'default'} index={index} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SectionPreviews;
