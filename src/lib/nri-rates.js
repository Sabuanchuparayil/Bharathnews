/** Live FX + commodity rates for NRIs — fetched server-side with caching. */

const TROY_OZ_GRAMS = 31.1034768;
const FX_URL = 'https://open.er-api.com/v6/latest/USD';
const METAL_URL = 'https://api.gold-api.com/price';

export const NRI_CURRENCY_PAIRS = [
  { code: 'AED', label: 'UAE Dirham', region: 'UAE' },
  { code: 'USD', label: 'US Dollar', region: 'USA' },
  { code: 'SAR', label: 'Saudi Riyal', region: 'Saudi' },
  { code: 'QAR', label: 'Qatar Riyal', region: 'Qatar' },
  { code: 'KWD', label: 'Kuwait Dinar', region: 'Kuwait' },
  { code: 'BHD', label: 'Bahrain Dinar', region: 'Bahrain' },
  { code: 'OMR', label: 'Oman Rial', region: 'Oman' },
  { code: 'GBP', label: 'UK Pound', region: 'UK' },
  { code: 'EUR', label: 'Euro', region: 'Europe' },
];

const METALS = [
  { symbol: 'XAU', key: 'gold', label: 'Gold' },
  { symbol: 'XAG', key: 'silver', label: 'Silver' },
  { symbol: 'XPT', key: 'platinum', label: 'Platinum' },
];

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function inrPerUnit(usdRates, code) {
  const inrPerUsd = usdRates.INR;
  if (!inrPerUsd) return null;
  if (code === 'USD') return inrPerUsd;
  const unitsPerUsd = usdRates[code];
  if (!unitsPerUsd) return null;
  return inrPerUsd / unitsPerUsd;
}

function buildCurrencies(usdRates) {
  return NRI_CURRENCY_PAIRS.map(({ code, label, region }) => {
    const inr = inrPerUnit(usdRates, code);
    return {
      code,
      label,
      region,
      inrPerUnit: inr ? round(inr, 2) : null,
      display: inr ? `₹${formatNum(inr, 2)}` : '—',
    };
  }).filter(c => c.inrPerUnit != null);
}

function buildCommodities(usdRates, metalPrices) {
  const inrPerUsd = usdRates.INR;
  const aedPerUsd = usdRates.AED;
  const items = [];

  const gold = metalPrices.gold;
  if (gold && inrPerUsd) {
    const inrPer10g = gold * inrPerUsd * (10 / TROY_OZ_GRAMS);
    const aedPerGram = aedPerUsd ? (gold * aedPerUsd) / TROY_OZ_GRAMS : null;
    items.push({
      key: 'gold',
      label: 'Gold (24K)',
      inrPer10g: round(inrPer10g, 0),
      aedPerGram: aedPerGram ? round(aedPerGram, 2) : null,
      usdPerOz: round(gold, 2),
      displayIn: `₹${formatNum(inrPer10g, 0)}/10g`,
      displayGulf: aedPerGram ? `AED ${formatNum(aedPerGram, 2)}/g` : null,
    });
  }

  const silver = metalPrices.silver;
  if (silver && inrPerUsd) {
    const inrPer10g = silver * inrPerUsd * (10 / TROY_OZ_GRAMS);
    items.push({
      key: 'silver',
      label: 'Silver',
      inrPer10g: round(inrPer10g, 0),
      usdPerOz: round(silver, 2),
      displayIn: `₹${formatNum(inrPer10g, 0)}/10g`,
      displayGulf: aedPerUsd
        ? `AED ${formatNum((silver * aedPerUsd) / TROY_OZ_GRAMS, 2)}/g`
        : null,
    });
  }

  const platinum = metalPrices.platinum;
  if (platinum && inrPerUsd) {
    const inrPer10g = platinum * inrPerUsd * (10 / TROY_OZ_GRAMS);
    items.push({
      key: 'platinum',
      label: 'Platinum',
      inrPer10g: round(inrPer10g, 0),
      usdPerOz: round(platinum, 2),
      displayIn: `₹${formatNum(inrPer10g, 0)}/10g`,
    });
  }

  return items;
}

function round(n, d) {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function formatNum(n, d) {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);
}

export async function fetchNriRates() {
  const [fxData, ...metalResults] = await Promise.all([
    fetchJson(FX_URL),
    ...METALS.map(m =>
      fetchJson(`${METAL_URL}/${m.symbol}`).catch(() => null)
    ),
  ]);

  if (fxData?.result !== 'success' || !fxData.rates?.INR) {
    throw new Error('FX rates unavailable');
  }

  const metalPrices = {};
  METALS.forEach((m, i) => {
    const row = metalResults[i];
    if (row?.price) metalPrices[m.key] = row.price;
  });

  const updatedAt = fxData.time_last_update_utc || new Date().toISOString();

  return {
    updatedAt: new Date(updatedAt).toISOString(),
    source: {
      fx: 'ExchangeRate-API',
      metals: 'Gold-API.com',
    },
    currencies: buildCurrencies(fxData.rates),
    commodities: buildCommodities(fxData.rates, metalPrices),
  };
}
