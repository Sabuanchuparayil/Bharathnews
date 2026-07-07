'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Globe2, Mail, Newspaper, Users } from 'lucide-react';
import Layout from '../components/Layout';

const EDITORIAL_EMAIL = 'bharathnewsweb@gmail.com';

const About = () => (
  <Layout mainClassName="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
    <header className="mb-8 sm:mb-10">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-2">About us</p>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
        About The Bharath News
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
        The Bharath News is a multilingual digital news platform serving Indians at home and across
        the Gulf, with real-time coverage in English, Malayalam, Hindi, Tamil, Telugu, Kannada,
        Bengali, and Urdu.
      </p>
    </header>

    <div className="space-y-8">
      <section className="glass-card-solid rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-4">
          <Newspaper className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Our mission</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          We help Indians and the global diaspora stay informed with timely news from India and GCC
          countries — politics, business, cricket, entertainment, jobs, health, and community stories
          that matter to NRI readers in the UAE, Saudi Arabia, Qatar, and beyond.
        </p>
      </section>

      <section className="glass-card-solid rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-4">
          <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Who we are</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          The Bharath News is operated by <strong>Cybpress Innovative Solutions LLP</strong>. We publish
          aggregated and curated news from verified sources with editorial oversight, clear attribution,
          and a corrections process.
        </p>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
          Editorial decisions are independent of advertisers. Our standards, sourcing rules, and
          correction policy are published on our{' '}
          <Link href="/editorial" className="text-brand-600 dark:text-brand-400 hover:underline">
            Editorial &amp; Corrections Policy
          </Link>{' '}
          page.
        </p>
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div className="glass-card-solid rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <Globe2 className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-3" />
          <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-2">Coverage</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            India national and state news, GCC/Gulf affairs, business, technology, sports, entertainment,
            health, education, jobs, and lifestyle — with strong focus on Kerala, Tamil Nadu, and
            diaspora communities.
          </p>
        </div>
        <div className="glass-card-solid rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <Users className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-3" />
          <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-2">Audience</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Readers in India, UAE, Saudi Arabia, Qatar, Bahrain, Kuwait, Oman, and the wider Indian
            diaspora who want news in English and regional Indian languages.
          </p>
        </div>
      </section>

      <section className="glass-card-solid rounded-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2.5 mb-4">
          <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">Contact</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
          For editorial tips, corrections, partnerships, or general enquiries, visit our{' '}
          <Link href="/contact" className="text-brand-600 dark:text-brand-400 hover:underline">
            Contact page
          </Link>{' '}
          or email{' '}
          <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand-600 dark:text-brand-400 hover:underline">
            {EDITORIAL_EMAIL}
          </a>.
        </p>
      </section>
    </div>
  </Layout>
);

export default About;
