'use client';

import React from 'react';
import Layout from '../components/Layout';

const DataDeletion = () => (
  <Layout mainClassName="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <h1 className="font-display font-bold text-3xl text-gray-900 dark:text-white mb-6">Data Deletion Instructions</h1>
    <div className="glass-card-solid rounded-2xl p-6 sm:p-8 prose prose-lg dark:prose-invert max-w-none">
      <p>Last updated: June 2026</p>
      <p>
        The Bharath News respects your right to control your personal data. If you wish to delete your account
        and all associated data from our platform, you can do so using one of the following methods:
      </p>

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">How to Request Data Deletion</h2>

      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white pt-1">Option 1: Email Request</h3>
      <p>
        Send an email to{' '}
        <a href="mailto:privacy@thebharathnews.com" className="text-brand-600 dark:text-brand-400 hover:underline">
          privacy@thebharathnews.com
        </a>
        {' '}with the subject line <strong>&quot;Data Deletion Request&quot;</strong>. Include the email address associated with your account.
      </p>

      <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white pt-1">Option 2: Through Your Account Settings</h3>
      <p>
        Log in to your account, go to <strong>Settings</strong>, and click <strong>&quot;Delete My Account&quot;</strong>.
        This will immediately remove your profile and begin the data deletion process.
      </p>

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">What Gets Deleted</h2>
      <ul>
        <li>Your account profile and login credentials</li>
        <li>Saved bookmarks and reading preferences</li>
        <li>Interest and language preferences</li>
        <li>Push notification subscriptions</li>
        <li>Any comments or interactions</li>
      </ul>

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Processing Time</h2>
      <p>
        Data deletion requests are processed within <strong>30 days</strong>. You will receive a confirmation email
        once your data has been permanently removed from our systems.
      </p>

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Facebook Login Users</h2>
      <p>
        If you signed in using Facebook, deleting your data from The Bharath News does not affect your Facebook account.
        To remove our app&apos;s access to your Facebook data, go to{' '}
        <a href="https://www.facebook.com/settings?tab=applications" className="text-brand-600 dark:text-brand-400 hover:underline" target="_blank" rel="noopener noreferrer">
          Facebook Settings → Apps and Websites
        </a>
        {' '}and remove &quot;Bharath News Auto Post&quot;.
      </p>

      <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white pt-2">Contact</h2>
      <p>
        For questions about data deletion, contact{' '}
        <a href="mailto:privacy@thebharathnews.com" className="text-brand-600 dark:text-brand-400 hover:underline">
          privacy@thebharathnews.com
        </a>
      </p>
    </div>
  </Layout>
);

export default DataDeletion;
