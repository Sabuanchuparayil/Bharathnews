import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SocialMediaPosting from '../components/SocialMediaPosting';

const Community = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="font-display font-bold text-3xl text-gray-900 mb-6">Community</h1>
        <p className="text-gray-600 mb-8">Engage with the community, share perspectives, and discuss the latest news.</p>
        
        {/* Social Media Posting Section */}
        <SocialMediaPosting />
        
        {/* Add community features like forums, comments, etc. */}
        <div className="mt-12">
          <h2 className="font-display font-bold text-2xl text-gray-900 mb-6">Discussion Forums</h2>
          <p className="text-gray-600">Community forums and discussion threads coming soon.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Community;