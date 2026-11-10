/**
 * Enable dlvr.it mode for Facebook — disable Worker Graph API, skip queued FB jobs.
 * Usage: npm run facebook:dlvr-mode
 */
import { workerFetch } from './worker-fetch.mjs';

async function main() {
  const res = await workerFetch('/api/facebook-dlvr-mode');
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!data.ok) process.exit(1);
  console.log('\nFacebook: dlvr.it mode active');
  console.log('RSS feed for dlvr.it:', data.dlvrItFeedUrl);
  console.log('Skipped Worker Facebook jobs:', data.facebookJobsSkipped);
}

main().catch(err => { console.error(err); process.exit(1); });
