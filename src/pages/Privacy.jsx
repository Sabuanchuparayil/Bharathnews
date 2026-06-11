import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Privacy = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Privacy Policy</h1>
      <div className="prose prose-lg text-gray-700">
        <p>Last updated: June 2026</p>
        <p>The Bharath News (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our news platform.</p>
        <h2>Information We Collect</h2>
        <p>We collect information you provide directly (such as when you sign in with Google), usage data (articles read, bookmarks), and device information for push notifications.</p>
        <h2>How We Use Your Information</h2>
        <p>We use your data to personalize news recommendations, improve our service, and send notifications you opt into.</p>
        <h2>Contact</h2>
        <p>For privacy inquiries, contact us at privacy@thebharathnews.com</p>
      </div>
    </main>
    <Footer />
  </div>
);

export default Privacy;
