'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import { subscribeNewsletter, getSubscriberCount } from '../services/firestore';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    getSubscriberCount().then(count => setSubscriberCount(count)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await subscribeNewsletter(email);
      setSubscribed(true);
      toast.success('Subscribed successfully!');
    } catch (err) {
      if (err.message === 'ALREADY_SUBSCRIBED') {
        setSubscribed(true);
        toast.info('You\'re already subscribed!');
      } else {
        console.error(err);
        toast.error('Subscription failed. Please try again.');
      }
    }
    setLoading(false);
  };

  if (subscribed) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card-solid rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-accent-emerald mx-auto mb-3" />
        <h3 className="font-display font-bold text-gray-900 dark:text-white">You&apos;re in!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Weekly digest coming to your inbox.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
      <Mail className="w-8 h-8 text-brand-200 mb-3" />
      <h3 className="font-display font-bold text-lg mb-1">Stay Informed</h3>
      <p className="text-sm text-brand-200 mb-2">Weekly AI-curated digest from India & GCC</p>
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-4 h-4 text-brand-200" />
        <span className="text-xs text-brand-200">Join {subscriberCount > 0 ? subscriberCount.toLocaleString() : '...'}+ readers</span>
      </div>
      <div className="flex -space-x-2 mb-4">
        {['#4338ca', '#10b981', '#f59e0b', '#f43f5e'].map((color, i) => (
          <div key={color} className="w-7 h-7 rounded-full border-2 border-brand-700 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: color }}>
            {['A', 'R', 'K', 'S'][i]}
          </div>
        ))}
        <div className="w-7 h-7 rounded-full bg-brand-500 border-2 border-brand-700 flex items-center justify-center text-[9px] font-bold">+{subscriberCount > 0 ? `${Math.floor(subscriberCount / 1000)}K` : '...'}</div>
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          aria-label="Email for newsletter"
          className="flex-1 px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-white/40"
          required
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Subscribe"
          className="p-2.5 bg-white text-brand-700 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-50"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default NewsletterSignup;
