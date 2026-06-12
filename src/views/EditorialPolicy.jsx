'use client';

import React from 'react';
import Link from 'next/link';
import {
  Scale, ShieldCheck, Users, Eye, Mail, FileText, Bot, Tag, PenLine, Building2,
} from 'lucide-react';
import Layout from '../components/Layout';

const EDITORIAL_EMAIL = 'bharathnewsweb@gmail.com';

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Accuracy first',
    text: 'We verify facts before publishing and attribute information to credible sources.',
  },
  {
    icon: Scale,
    title: 'Independence',
    text: 'Editorial decisions are made independently of advertisers and commercial partners.',
  },
  {
    icon: Users,
    title: 'Fairness and balance',
    text: 'We seek relevant perspectives and give subjects of critical coverage a fair opportunity to respond.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    text: 'We clearly label news, opinion, analysis, and sponsored content.',
  },
];

const CONTENT_TYPES = [
  { label: 'News', text: 'Factual reporting.' },
  { label: 'Opinion / Editorial', text: "Reflects the writer's views and is labelled accordingly." },
  { label: 'Sponsored / Affiliate', text: 'Clearly marked. We may earn a commission from some links; this never influences our editorial judgement.' },
];

function Section({ id, icon: Icon, title, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-2.5 mb-4">
        {Icon && <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />}
        <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

const EditorialPolicy = () => (
  <Layout mainClassName="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
    <header className="mb-8 sm:mb-10">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mb-2">Legal &amp; Standards</p>
      <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white mb-4">
        Editorial &amp; Corrections Policy
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
        The Bharath News is committed to accurate, fair, and independent journalism. This policy explains
        how we produce, verify, and correct our content. It applies to all our coverage across English,
        Malayalam, Hindi, and Tamil.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Last updated: 12 June 2026</p>
    </header>

    <nav
      aria-label="On this page"
      className="glass-card-solid rounded-2xl p-4 sm:p-5 mb-8 border border-gray-100 dark:border-gray-800"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">On this page</p>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {[
          ['principles', 'Our principles'],
          ['sourcing', 'Sourcing'],
          ['ai', 'AI disclosure'],
          ['content-types', 'Content types'],
          ['corrections', 'Corrections'],
          ['unpublishing', 'Unpublishing'],
          ['ownership', 'Ownership'],
          ['contact', 'Contact'],
        ].map(([id, label]) => (
          <li key={id}>
            <a href={`#${id}`} className="text-brand-600 dark:text-brand-400 hover:underline">{label}</a>
          </li>
        ))}
      </ul>
    </nav>

    <div className="space-y-10 sm:space-y-12">
      <Section id="principles" icon={Scale} title="Our principles">
        <div className="grid sm:grid-cols-2 gap-4 not-prose">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="glass-card-solid rounded-xl p-5 border border-gray-100 dark:border-gray-800"
            >
              <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400 mb-3" />
              <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="h-px bg-gray-200 dark:bg-gray-800" />

      <Section id="sourcing" icon={FileText} title="Sourcing">
        <p>
          We rely on first-hand reporting, official statements, named sources where possible, and reputable
          news agencies. When we use wire or third-party content, we attribute it. Anonymous sources are used
          only when necessary and with editorial approval.
        </p>
      </Section>

      <Section id="ai" icon={Bot} title="AI and automation disclosure">
        <p>
          We may use automated tools to assist with translation, formatting, data pages (such as currency or
          commodity rates), and distribution. All news and editorial content is reviewed by a human editor
          before and after publication. Automatically updated data (e.g. gold rates) is sourced from third-party
          providers and timestamped.
        </p>
      </Section>

      <Section id="content-types" icon={Tag} title="Distinguishing content types">
        <ul className="space-y-3 not-prose">
          {CONTENT_TYPES.map(({ label, text }) => (
            <li
              key={label}
              className="flex gap-3 glass-card-solid rounded-xl p-4 border border-gray-100 dark:border-gray-800"
            >
              <PenLine className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-900 dark:text-white">{label}</span>
                <span className="text-gray-600 dark:text-gray-400"> — {text}</span>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="corrections" icon={PenLine} title="Corrections">
        <p>We correct errors promptly and transparently.</p>
        <ul className="list-disc pl-5 space-y-2 marker:text-brand-600">
          <li>
            To report an error, email{' '}
            <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand-600 dark:text-brand-400 hover:underline">
              {EDITORIAL_EMAIL}
            </a>{' '}
            with the article URL and details.
          </li>
          <li>
            When we correct a substantive error, we update the article and add a dated correction note at the bottom.
          </li>
          <li>Minor typos may be fixed without a note.</li>
        </ul>
      </Section>

      <Section id="unpublishing" icon={FileText} title="Unpublishing">
        <p>
          We generally do not unpublish content, as it forms part of the public record. In limited cases (legal,
          safety, or privacy reasons) we may update or remove an article.
        </p>
      </Section>

      <Section id="ownership" icon={Building2} title="Ownership &amp; funding">
        <p>
          The Bharath News is owned by <strong className="font-semibold text-gray-900 dark:text-white">Cybpress innovative solutions LLP</strong> and
          funded primarily through advertising and affiliate partnerships. Commercial relationships do not
          influence our reporting.
        </p>
      </Section>

      <div className="glass-card-solid rounded-2xl p-6 sm:p-8 border border-brand-200/60 dark:border-brand-800/40 bg-brand-50/30 dark:bg-brand-950/20">
        <Section id="contact" icon={Mail} title="Contact">
          <p>
            Editorial questions:{' '}
            <a href={`mailto:${EDITORIAL_EMAIL}`} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {EDITORIAL_EMAIL}
            </a>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 pt-2">
            See also our{' '}
            <Link href="/contact" className="text-brand-600 dark:text-brand-400 hover:underline">Contact page</Link>
            ,{' '}
            <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">Privacy Policy</Link>
            {' '}and{' '}
            <Link href="/terms" className="text-brand-600 dark:text-brand-400 hover:underline">Terms of Service</Link>.
          </p>
        </Section>
      </div>
    </div>
  </Layout>
);

export default EditorialPolicy;
