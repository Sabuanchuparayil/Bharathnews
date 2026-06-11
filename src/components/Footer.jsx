import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-1 dark:bg-dark-surface-0 border-t border-gray-100 dark:border-gray-800 pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="font-display font-bold text-lg text-gray-900 dark:text-white">BharathNews</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              AI-powered news for the India-GCC community. Breaking news, business, technology — in English, Malayalam, and Arabic.
            </p>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">News</h4>
            <ul className="space-y-2.5">
              {['India', 'GCC', 'Business', 'Technology', 'Videos'].map(link => (
                <li key={link}><Link to={`/${link.toLowerCase()}`} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{link}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">Follow Us</h4>
            <ul className="space-y-2.5">
              {['WhatsApp Channel', 'Telegram', 'YouTube', 'Instagram', 'Facebook'].map(link => (
                <li key={link}><a href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{link}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-bold text-sm text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2.5">
              {[['Privacy', '/privacy'], ['Terms', '/terms'], ['Contact', '#']].map(([label, href]) => (
                <li key={label}><Link to={href} className="text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-400 flex items-center space-x-1">
            <span>&copy; {year} The Bharath News.</span>
            <span className="hidden sm:inline">Made with</span>
            <Heart className="w-3.5 h-3.5 text-accent-rose hidden sm:inline" />
            <span className="hidden sm:inline">and AI</span>
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-400 bg-surface-2 dark:bg-dark-surface-2 px-3 py-1 rounded-full">v1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
