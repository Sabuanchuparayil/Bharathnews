import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Terms = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Terms of Service</h1>
      <div className="prose prose-lg text-gray-700">
        <p>Last updated: June 2026</p>
        <p>By using The Bharath News, you agree to these terms. Our platform aggregates and presents news content for informational purposes.</p>
        <h2>Use of Service</h2>
        <p>You may use our service for personal, non-commercial purposes. You agree not to misuse the platform or attempt to access it through unauthorized means.</p>
        <h2>Content</h2>
        <p>News articles may be sourced from third parties and processed with AI. We strive for accuracy but do not guarantee completeness of all information.</p>
        <h2>Contact</h2>
        <p>For questions about these terms, contact legal@thebharathnews.com</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Terms;
