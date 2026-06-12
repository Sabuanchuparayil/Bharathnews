'use client';

import React, { useState, useCallback } from 'react';
import { Languages, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getArticleSourceLang,
  listAvailableReadLangs,
  listOnDemandLangs,
  resolveArticleDisplay,
} from '@/lib/article-translations';
import { getLanguageByCode } from '@/config/languages.config';

export default function ArticleReadLanguage({
  article,
  readLang,
  onReadLangChange,
  onTranslationLoaded,
}) {
  const [translating, setTranslating] = useState(null);
  const [pendingLang, setPendingLang] = useState(null);

  const sourceLang = getArticleSourceLang(article);
  const available = listAvailableReadLangs(article);
  const onDemand = listOnDemandLangs(article);
  const activeLang = readLang === 'all' ? sourceLang : readLang;
  const display = resolveArticleDisplay(article, activeLang);
  const showMachineBadge = display?.isTranslation && display?.machineAssisted;

  const requestTranslation = useCallback(async (langCode) => {
    if (!article?.slug || translating) return;
    setTranslating(langCode);
    setPendingLang(langCode);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(article.slug)}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetLang: langCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Translation failed');
      onTranslationLoaded?.(langCode, data.translation);
      onReadLangChange(langCode);
      toast.success(`Article loaded in ${getLanguageByCode(langCode).nativeName}`);
    } catch (err) {
      toast.error(err.message || 'Could not translate this article');
    } finally {
      setTranslating(null);
      setPendingLang(null);
    }
  }, [article?.slug, translating, onTranslationLoaded, onReadLangChange]);

  const selectLang = (code) => {
    if (code === sourceLang) {
      onReadLangChange(sourceLang);
      return;
    }
    if (resolveArticleDisplay(article, code)) {
      onReadLangChange(code);
      return;
    }
    requestTranslation(code);
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-surface-1 dark:bg-dark-surface-1 p-4">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Languages className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Read in</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map(({ code, nativeName }) => (
          <button
            key={code}
            type="button"
            disabled={!!translating}
            onClick={() => selectLang(code)}
            className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
              activeLang === code
                ? 'bg-brand-600 text-white'
                : 'bg-surface-2 dark:bg-dark-surface-2 text-gray-600 dark:text-gray-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 hover:text-brand-700 dark:hover:text-brand-300'
            }`}
          >
            {code === sourceLang ? `${nativeName} (original)` : nativeName}
            {pendingLang === code && translating === code && (
              <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />
            )}
          </button>
        ))}
        {onDemand.map(({ code, nativeName }) => (
          <button
            key={code}
            type="button"
            disabled={!!translating}
            onClick={() => requestTranslation(code)}
            className="text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            {translating === code ? (
              <Loader2 className="w-3 h-3 inline animate-spin" />
            ) : (
              `+ ${nativeName}`
            )}
          </button>
        ))}
      </div>
      {showMachineBadge && (
        <p className="flex items-start gap-2 mt-3 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Machine-assisted translation — reviewed for accuracy where possible. See our{' '}
          <a href="/editorial" className="underline hover:text-amber-900 dark:hover:text-amber-200">Editorial Policy</a>.
        </p>
      )}
    </div>
  );
}
