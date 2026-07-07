'use client';

import React from 'react';
import Layout from '../components/Layout';

const Privacy = () => (
  <Layout mainClassName="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
    <div className="glass-card-solid rounded-2xl p-6 sm:p-8 prose prose-lg dark:prose-invert max-w-none">
      <p>Last updated: June 2026</p>
      <p>The Bharath News (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information when you use our news platform.</p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Information We Collect</h2>
      <p>We collect information you provide directly (such as when you sign in with Google), usage data (articles read, bookmarks), and device information for push notifications.</p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">How We Use Your Information</h2>
      <p>We use your data to personalize news recommendations, improve our service, and send notifications you opt into.</p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Cookies</h2>
      <p>We use cookies and similar technologies for functionality, analytics, and advertising. You can control cookies through your browser settings.</p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Advertising</h2>
      <p>
        We use third-party advertising, including Google AdSense, to support our journalism. Third-party vendors, including Google, use cookies (such as the DART cookie) to serve ads based on your prior visits to this and other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your visit to our site and others on the internet. You may opt out of personalised advertising via{' '}
        <a href="https://google.com/settings/ads" className="text-brand-600 dark:text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>
        , the{' '}
        <a href="https://policies.google.com/technologies/ads" className="text-brand-600 dark:text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">Google advertising technology policy</a>
        , or{' '}
        <a href="https://www.aboutads.info" className="text-brand-600 dark:text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">aboutads.info</a>.
        {' '}Our advertising partners may include Google AdSense and social distribution platforms (Facebook, Telegram). Where required (EU, UK, and applicable GCC users), we request consent before setting non-essential cookies.
      </p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Your Rights</h2>
      <p>
        You may request access to, correction of, or deletion of your personal data by emailing{' '}
        <a href="mailto:privacy@thebharathnews.com" className="text-brand-600 dark:text-brand-400 hover:underline">privacy@thebharathnews.com</a>.
        {' '}You can also lodge a complaint with your local data-protection authority.
      </p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Third-Party Integrations</h2>
      <p>
        We may share articles and content to our social media channels (Facebook, Telegram, Instagram) as part of our publishing workflow. If you interact with our content on these platforms, their respective privacy policies apply. We do not collect personal data from social media interactions unless you voluntarily engage with our platform directly.
      </p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Data Retention &amp; Security</h2>
      <p>We retain personal data only as long as necessary and use reasonable measures to protect it. No method of transmission over the internet is fully secure.</p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Data Deletion</h2>
      <p>
        You may request deletion of all your personal data at any time by emailing{' '}
        <a href="mailto:privacy@thebharathnews.com" className="text-brand-600 dark:text-brand-400 hover:underline">privacy@thebharathnews.com</a>
        {' '}with the subject line &quot;Data Deletion Request&quot;. We will process your request within 30 days and confirm once your data has been removed from our systems.
      </p>
      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Contact</h2>
      <p>For privacy inquiries, contact us at privacy@thebharathnews.com</p>
    </div>
  </Layout>
);

export default Privacy;
