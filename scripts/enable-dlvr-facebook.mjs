/**
 * Enable dlvr.it mode for Facebook — disable Worker Graph API, skip queued FB jobs.
 * Usage: npm run facebook:dlvr-mode
 */
const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev';

async function main() {
  const res = await fetch(`${WORKER}/api/facebook-dlvr-mode?k=run7x9k`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
  if (!data.ok) process.exit(1);
  console.log('\nFacebook: dlvr.it mode active');
  console.log('RSS feed for dlvr.it:', data.dlvrItFeedUrl);
  console.log('Skipped Worker Facebook jobs:', data.facebookJobsSkipped);
}

main().catch(err => { console.error(err); process.exit(1); });
