'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';

const TOPICS = [
  { value: 'general', label: 'General enquiry' },
  { value: 'editorial', label: 'Editorial / news tip' },
  { value: 'correction', label: 'Report an error' },
  { value: 'advertising', label: 'Advertising & partnerships' },
  { value: 'technical', label: 'Technical support' },
];

const EDITORIAL_EMAIL = 'bharathnewsweb@gmail.com';

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    topic: 'general',
    subject: '',
    message: '',
    website: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send message');
      setSent(true);
      toast.success(data.message || 'Message sent!');
      setForm({ name: '', email: '', topic: 'general', subject: '', message: '', website: '' });
    } catch (err) {
      toast.error(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout mainClassName="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      <header className="mb-8 sm:mb-10">
        <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-2">Get in touch</p>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-3">Contact Us</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
          Questions, news tips, corrections, or partnership enquiries — send us a message and we will respond by email.
        </p>
      </header>

      <div className="grid lg:grid-cols-5 gap-8">
        <aside className="lg:col-span-2 space-y-4">
          <div className="glass-card-solid rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-3" />
            <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-1">Email</h2>
            <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-sm text-brand-600 dark:text-brand-400 hover:underline break-all">
              {EDITORIAL_EMAIL}
            </a>
          </div>
          <div className="glass-card-solid rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <MapPin className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-3" />
            <h2 className="font-display font-semibold text-gray-900 dark:text-white mb-1">Coverage</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              India &amp; GCC — English, Malayalam, Hindi, Tamil, and more.
            </p>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
            For corrections, include the article URL. See our{' '}
            <Link href="/editorial" className="text-brand-600 dark:text-brand-400 hover:underline">Editorial Policy</Link>.
          </p>
        </aside>

        <div className="lg:col-span-3">
          {sent ? (
            <div className="glass-card-solid rounded-2xl p-8 text-center border border-green-200 dark:border-green-900/50">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Message sent</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Thank you — we received your email and will reply soon.</p>
              <button type="button" onClick={() => setSent(false)} className="btn-secondary px-5 py-2 rounded-xl text-sm">
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card-solid rounded-2xl p-6 sm:p-8 space-y-5">
              <div className="absolute opacity-0 pointer-events-none h-0 overflow-hidden" aria-hidden="true">
                <label htmlFor="website">Website</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={e => update('website', e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                    className="input-field"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={e => update('email', e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic</label>
                <select
                  id="topic"
                  value={form.topic}
                  onChange={e => update('topic', e.target.value)}
                  className="input-field"
                >
                  {TOPICS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <input
                  id="subject"
                  type="text"
                  required
                  value={form.subject}
                  onChange={e => update('subject', e.target.value)}
                  className="input-field"
                  placeholder="Brief subject line"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea
                  id="message"
                  required
                  minLength={10}
                  rows={6}
                  value={form.message}
                  onChange={e => update('message', e.target.value)}
                  className="input-field resize-y min-h-[140px]"
                  placeholder="Your message (minimum 10 characters)"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
