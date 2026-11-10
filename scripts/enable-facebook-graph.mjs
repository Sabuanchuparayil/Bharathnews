/**
 * Enable Worker Graph API for Facebook — direct posting (bypasses dlvr.it).
 * Requires FACEBOOK_PAGE_TOKEN + FACEBOOK_PAGE_ID in worker secrets.
 *
 * Usage:
 *   npm run facebook:graph-mode
 *   npm run facebook:graph-mode -- --lang en
 */
import { workerFetch } from './worker-fetch.mjs';

const lang = process.argv.includes('--lang')
  ? process.argv[process.argv.indexOf('--lang') + 1]
  : 'en';

async function main() {
  const res = await workerFetch(`/api/facebook-graph-mode?lang=${encodeURIComponent(lang)}`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!data.ok) process.exit(1);
  console.log('\nFacebook: Graph API mode active');
  console.log('Post language:', data.postLanguage || lang);
  console.log('Jobs enqueued:', data.jobsEnqueued ?? 0);
  if (data.warning) console.warn('\nWarning:', data.warning);
  if (data.hint) console.log(data.hint);
}

main().catch(err => { console.error(err); process.exit(1); });
