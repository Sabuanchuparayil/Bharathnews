'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check } from 'lucide-react';
import { CATEGORIES } from '../config/feeds.config';
import { useAuth } from '../context/AuthContext';

const ONBOARDING_CATEGORIES = CATEGORIES.filter(c => !['all', 'breaking'].includes(c.id));

const OnboardingModal = () => {
  const { user, userProfile, updateUserInterests } = useAuth();
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem('onboardingDismissed') === 'true');
  }, []);

  const completed = userProfile?.onboardingComplete;
  const shouldShow = user && !completed && !dismissed;

  if (!shouldShow) return null;

  const toggleCategory = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const categories = Object.fromEntries(selected.map(id => [id, 10]));
    await updateUserInterests({ categories, topics: selected });
    localStorage.setItem('onboardingDismissed', 'true');
    setSaving(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('onboardingDismissed', 'true');
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-dark-surface-1 rounded-3xl shadow-floating border border-gray-200 dark:border-gray-800 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 relative">
            <button
              onClick={handleDismiss}
              aria-label="Dismiss onboarding"
              className="absolute top-4 right-4 p-2 hover:bg-surface-2 dark:hover:bg-dark-surface-2 rounded-xl transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-accent-amber" />
              <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Personalize your feed
              </span>
            </div>
            <h2 id="onboarding-title" className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              What interests you?
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Pick topics to tailor your For You section. Select at least one.
            </p>
          </div>

          <div className="p-6 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
            {ONBOARDING_CATEGORIES.map(cat => {
              const isSelected = selected.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="font-display font-bold text-sm text-gray-900 dark:text-white">{cat.name}</span>
                </button>
              );
            })}
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleComplete}
              disabled={selected.length === 0 || saving}
              className="btn-primary w-full disabled:opacity-50"
            >
              {saving ? 'Saving...' : `Continue with ${selected.length || 0} selected`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
