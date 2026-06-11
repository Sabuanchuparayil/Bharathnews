import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PenLine, Video, Users, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import SocialMediaPosting from '../components/SocialMediaPosting';
import FeaturedCreators from '../components/FeaturedCreators';
import RSSFeed from '../components/RSSFeed';
import { RSS_FEEDS } from '../config/feeds.config';
import { useAuth } from '../context/AuthContext';

const Community = () => {
  const { isCreator, isContentWriter } = useAuth();
  const communityFeed = RSS_FEEDS.find(f => f.name === 'Scroll.in') || RSS_FEEDS[0];

  return (
    <Layout mainClassName="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet>
        <title>Community | The Bharath News</title>
        <meta name="description" content="Join the Bharath News community — become a citizen journalist, share stories, poems, and videos." />
      </Helmet>

      <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-2">Community</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Share your voice with the India-GCC diaspora. Write articles, stories, poems, or share videos.
      </p>

      {/* Creator CTA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Link to="/creator/apply" className="glass-card-solid rounded-2xl p-6 card-lift block group">
          <PenLine className="w-8 h-8 text-brand-600 mb-3" />
          <h2 className="font-display font-bold text-lg group-hover:text-brand-600 transition-colors">Become a Creator</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Apply as citizen journalist or vlogger</p>
        </Link>
        <Link to="/creator/new" className="glass-card-solid rounded-2xl p-6 card-lift block group">
          <Sparkles className="w-8 h-8 text-brand-600 mb-3" />
          <h2 className="font-display font-bold text-lg group-hover:text-brand-600 transition-colors">Submit Content</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Articles, stories, poems, journals</p>
        </Link>
        <Link to="/creator/space" className="glass-card-solid rounded-2xl p-6 card-lift block group">
          <Users className="w-8 h-8 text-brand-600 mb-3" />
          <h2 className="font-display font-bold text-lg group-hover:text-brand-600 transition-colors">Creator Space</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isCreator ? 'Manage your content & stats' : 'Your personal publishing hub'}
          </p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <FeaturedCreators />

          {isContentWriter && <SocialMediaPosting />}

          <div>
            <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
              <Video className="w-5 h-5 text-brand-600" /> Community Vloggers
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Video creators share their perspective on India-GCC news and culture.
            </p>
            <Link to="/creator/apply" className="text-brand-600 text-sm font-medium hover:underline">
              Apply to become a vlogger →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { title: 'India Discussions', desc: 'News, politics & culture', to: '/india' },
              { title: 'GCC Community', desc: 'Expat life & opportunities', to: '/gcc' },
              { title: 'Opinion & Editorial', desc: 'Perspectives & analysis', to: '/opinion' },
            ].map(forum => (
              <Link key={forum.title} to={forum.to} className="glass-card-solid rounded-2xl p-5 card-lift block">
                <h2 className="font-display font-bold text-base text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{forum.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{forum.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="hidden lg:block">
          <RSSFeed feedUrl={communityFeed.url} title={`Live from ${communityFeed.name}`} />
        </aside>
      </div>
    </Layout>
  );
};

export default Community;
