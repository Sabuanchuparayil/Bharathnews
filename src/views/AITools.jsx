'use client';

import React, { useState } from 'react';
import Layout from '../components/Layout';
import { FileText, Languages, Image } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const AITools = () => {
  const { user, isAdmin, isContentWriter, loading, loginWithGoogle } = useAuth();
  const [contentInput, setContentInput] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [adInput, setAdInput] = useState('');
  const [results, setResults] = useState({});

  const isAuthorized = isAdmin || isContentWriter;

  if (loading) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Please sign in to access Creator Tools.</p>
            <button onClick={loginWithGoogle} className="btn-primary">Sign in with Google</button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout showBottomNav={false} showChatbot={false}>
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="glass-card-solid rounded-2xl p-8 text-center max-w-md">
            <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-4">Access Denied</h1>
            <p className="text-gray-600 dark:text-gray-400">Admin or content writer role required.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const handleRewrite = () => {
    setResults({ ...results, rewrite: 'Rewritten content here.' });
    toast.success('Content rewritten!');
  };

  const handleTranslate = () => {
    setResults({ ...results, translation: 'Translated content here.' });
    toast.success('Translation completed!');
  };

  const handleGenerateAd = () => {
    setResults({ ...results, ad: 'Generated ad creative here.' });
    toast.success('Ad generated!');
  };

  return (
    <Layout showBottomNav={false} showChatbot={false} mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Creator Tools</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card-solid rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Rewrite Content</h2>
          </div>
          <textarea
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            placeholder="Enter content here..."
            className="input-field mb-4"
            rows="4"
          />
          <button onClick={handleRewrite} className="btn-primary">Rewrite</button>
          {results.rewrite && <p className="mt-4 p-3 bg-surface-2 dark:bg-dark-surface-2 rounded-xl text-gray-700 dark:text-gray-300">{results.rewrite}</p>}
        </div>

        <div className="glass-card-solid rounded-2xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Languages className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Translation</h2>
          </div>
          <textarea
            value={translationInput}
            onChange={(e) => setTranslationInput(e.target.value)}
            placeholder="Enter content to translate..."
            className="input-field mb-4"
            rows="4"
          />
          <button onClick={handleTranslate} className="btn-primary">Translate</button>
          {results.translation && <p className="mt-4 p-3 bg-surface-2 dark:bg-dark-surface-2 rounded-xl text-gray-700 dark:text-gray-300">{results.translation}</p>}
        </div>

        <div className="glass-card-solid rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4">
            <Image className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Ad Creative Generation</h2>
          </div>
          <textarea
            value={adInput}
            onChange={(e) => setAdInput(e.target.value)}
            placeholder="Enter ad description..."
            className="input-field mb-4"
            rows="4"
          />
          <button onClick={handleGenerateAd} className="btn-primary">Generate Ad</button>
          {results.ad && <p className="mt-4 p-3 bg-surface-2 dark:bg-dark-surface-2 rounded-xl text-gray-700 dark:text-gray-300">{results.ad}</p>}
        </div>
      </div>
    </Layout>
  );
};

export default AITools;
