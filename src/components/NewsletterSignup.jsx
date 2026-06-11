import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
      toast.success('Subscribed successfully!');
    }, 800);
  };

  if (subscribed) {
    return (
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card-solid rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-accent-emerald mx-auto mb-3" />
        <h3 className="font-display font-bold text-gray-900 dark:text-white">You're in!</h3>
        <p className="text-sm text-gray-500 mt-1">Weekly digest coming to your inbox.</p>
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white">
      <Mail className="w-8 h-8 text-brand-200 mb-3" />
      <h3 className="font-display font-bold text-lg mb-1">Stay Informed</h3>
      <p className="text-sm text-brand-200 mb-4">Weekly AI-curated digest from India & GCC</p>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-3.5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm placeholder-brand-200 focus:outline-none focus:ring-2 focus:ring-white/40"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2.5 bg-white text-brand-700 rounded-xl hover:bg-brand-50 transition-colors disabled:opacity-50"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default NewsletterSignup;
