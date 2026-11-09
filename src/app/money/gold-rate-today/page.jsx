import Link from 'next/link';
import Layout from '@/components/Layout';
import Breadcrumbs from '@/components/Breadcrumbs';
import { siteMetadata } from '@/lib/metadata';
import { fetchNriRates } from '@/lib/nri-rates';

export const revalidate = 900;

const TROY_OZ_GRAMS = 31.1034768;
const KARAT_RATIO = 22 / 24;

const LOCAL_CODES = [
  { code: 'AED', label: 'UAE' },
  { code: 'SAR', label: 'Saudi Arabia' },
  { code: 'QAR', label: 'Qatar' },
  { code: 'OMR', label: 'Oman' },
  { code: 'BHD', label: 'Bahrain' },
  { code: 'KWD', label: 'Kuwait' },
  { code: 'INR', label: 'India' },
];

export const metadata = siteMetadata({
  title: 'Gold Rate Today UAE — 22K and 24K in Dirham and Rupee',
  description: 'Today’s 22K and 24K gold price in UAE dirham, Saudi riyal, Qatar riyal, and Indian rupee. Swarnam vila for Malayali NRIs in the Gulf.',
  path: '/money/gold-rate-today',
  keywords: [
    'gold rate today UAE',
    'gold price Dubai dirham',
    '22k gold rate today',
    'swarnam vila inna',
    'gold rate Saudi riyal',
    'gold price Qatar',
    'NRI gold rate',
  ],
});

function money(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function perGram(rates, code, usdPerGram) {
  if (code === 'INR') {
    const usd = rates.currencies.find(item => item.code === 'USD');
    if (!usd?.inrPerUnit) return null;
    return usdPerGram * usd.inrPerUnit;
  }
  const inrPerUsd = rates.currencies.find(item => item.code === 'USD')?.inrPerUnit;
  const inrPerUnit = rates.currencies.find(item => item.code === code)?.inrPerUnit;
  if (!inrPerUsd || !inrPerUnit) return null;
  return usdPerGram * (inrPerUsd / inrPerUnit);
}

export default async function GoldRateTodayPage() {
  let rates = null;
  let error = null;
  try {
    rates = await fetchNriRates();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Rates unavailable';
  }

  const gold = rates?.commodities?.find(item => item.key === 'gold');
  const usdPerGram = gold?.usdPerOz ? gold.usdPerOz / TROY_OZ_GRAMS : null;
  const rows = usdPerGram
    ? LOCAL_CODES.map(item => {
      const k24 = perGram(rates, item.code, usdPerGram);
      return {
        ...item,
        k24,
        k22: k24 == null ? null : k24 * KARAT_RATIO,
      };
    }).filter(row => row.k24 != null)
    : [];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { name: 'Home', href: '/' },
          { name: 'Money', href: '/money' },
          { name: 'Gold rate today' },
        ]} />
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 dark:text-white">
          Gold rate today
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          22K and 24K gold per gram for Gulf Malayalis. Figures are mid-market spot prices, not a jeweller’s quote.
        </p>

        {error && (
          <p className="mt-6 text-sm text-red-700 dark:text-red-300">
            Rates are temporarily unavailable. {error}
          </p>
        )}

        {rows.length > 0 && (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-dark-surface-1 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Market</th>
                  <th className="px-4 py-3 font-semibold">22K / gram</th>
                  <th className="px-4 py-3 font-semibold">24K / gram</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.code} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3 font-medium">{row.label} ({row.code})</td>
                    <td className="px-4 py-3 tabular-nums">{money(row.k22, row.code === 'INR' ? 0 : 2)}</td>
                    <td className="px-4 py-3 tabular-nums">{money(row.k24, row.code === 'INR' ? 0 : 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rates?.updatedAt && (
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Updated {new Date(rates.updatedAt).toUTCString()}. 22K is 22/24 of the spot 24K price.
            Sources: ExchangeRate-API and Gold-API.com. Not financial advice.
          </p>
        )}

        <p className="mt-6">
          <Link href="/money" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
            More money news
          </Link>
        </p>
      </div>
    </Layout>
  );
}
