import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteMetadata } from '@/lib/metadata';
import { GULF_EVENTS } from '@/data/gulf-events';

export const metadata = siteMetadata({
  title: 'Gulf Malayali events calendar',
  description: 'Onam, Vishu, parish Christmas, and other gatherings Malayalis in the Gulf look up. Venues are announced by each organiser.',
  path: '/events',
  keywords: ['Onam Dubai', 'Malayali events UAE', 'Vishu Qatar', 'Gulf Malayali calendar'],
});

export default function EventsPage() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Events' }]} />
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-stone-900 dark:text-white">
          Events in the Gulf
        </h1>
        <p className="mt-3 text-gray-600 dark:text-gray-300 leading-relaxed">
          Recurring occasions, not a ticket shop. The association, parish, or mission names the hall and the day. If your group has a date, send it and we will add the listing.
        </p>
        <ul className="mt-8 space-y-4">
          {GULF_EVENTS.map(event => (
            <li key={event.id} className="rounded-2xl border border-stone-200 dark:border-white/10 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display font-bold text-xl text-stone-900 dark:text-white">{event.name}</h2>
                <p className="text-sm font-medium text-brand-700 dark:text-brand-300">{event.when}</p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.where}</p>
              <p className="text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">{event.detail}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8">
          <Link href="/contact" className="btn-primary">
            Send an event
          </Link>
        </p>
      </div>
    </Layout>
  );
}
