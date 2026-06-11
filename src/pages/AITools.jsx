import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FileText, Languages, Image, Wand2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';

const AITools = () => {
  const [searchParams] = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [translationInput, setTranslationInput] = useState('');
  const [adInput, setAdInput] = useState('');
  const [results, setResults] = useState({});

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'admin') {
      setIsAuthorized(true);
    }
  }, [searchParams]);

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display font-bold text-3xl text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">AI Tools are only accessible to authorized admin users.</p>
        </div>
      </div>
    );
  }

  const handleRewrite = () => {
    // Mock AI rewrite
    setResults({ ...results, rewrite: 'AI-rewritten content here.' });
    toast.success('Content rewritten!');
  };

  const handleTranslate = () => {
    // Mock AI translation
    setResults({ ...results, translation: 'AI-translated content here.' });
    toast.success('Translation completed!');
  };

  const handleGenerateAd = () => {
    // Mock AI ad generation
    setResults({ ...results, ad: 'AI-generated ad creative here.' });
    toast.success('Ad generated!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">AI Tools</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Content Rewrite */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-6 h-6 text-indigo-700" />
              <h2 className="font-display font-bold text-xl">Rewrite Content</h2>
            </div>
            <textarea
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              placeholder="Enter content here..."
              className="w-full p-3 border rounded mb-4"
              rows="4"
            />
            <button onClick={handleRewrite} className="bg-indigo-700 text-white px-4 py-2 rounded-lg">
              Rewrite
            </button>
            {results.rewrite && <p className="mt-4 p-3 bg-gray-100 rounded">{results.rewrite}</p>}
          </div>

          {/* Translation */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center space-x-2 mb-4">
              <Languages className="w-6 h-6 text-indigo-700" />
              <h2 className="font-display font-bold text-xl">Translation</h2>
            </div>
            <textarea
              value={translationInput}
              onChange={(e) => setTranslationInput(e.target.value)}
              placeholder="Enter content to translate..."
              className="w-full p-3 border rounded mb-4"
              rows="4"
            />
            <button onClick={handleTranslate} className="bg-indigo-700 text-white px-4 py-2 rounded-lg">
              Translate
            </button>
            {results.translation && <p className="mt-4 p-3 bg-gray-100 rounded">{results.translation}</p>}
          </div>

          {/* Ad Creative Generation */}
          <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Image className="w-6 h-6 text-indigo-700" />
              <h2 className="font-display font-bold text-xl">Ad Creative Generation</h2>
            </div>
            <textarea
              value={adInput}
              onChange={(e) => setAdInput(e.target.value)}
              placeholder="Enter ad description..."
              className="w-full p-3 border rounded mb-4"
              rows="4"
            />
            <button onClick={handleGenerateAd} className="bg-indigo-700 text-white px-4 py-2 rounded-lg">
              Generate Ad
            </button>
            {results.ad && <p className="mt-4 p-3 bg-gray-100 rounded">{results.ad}</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AITools;