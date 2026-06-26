#!/usr/bin/env node
/** Diagnose Malayalam/English social RSS feeds for dlvr.it → Facebook compatibility. */
const DEBUG_LOG_URL = 'http://127.0.0.1:7274/ingest/d79347f0-a0aa-400f-b1f9-67a99a6beb00';
const SESSION_ID = '41010d';
const WORKER = process.env.WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev';

// #region agent log
function debugLog(hypothesisId, message, data, runId = 'fb-feed-check') {
  fetch(DEBUG_LOG_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION_ID },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      runId,
      hypothesisId,
      location: 'scripts/check-facebook-feed.mjs',
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}
// #endregion

async function checkFeed(name, url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'dlvr.it/1.0 (+https://dlvr.it)' } });
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => m[1]);
  const sample = items[0] || '';
  const withEnclosure = items.filter(b => /<enclosure[^>]+url=/i.test(b)).length;
  const withImgInDesc = items.filter(b => /<img[\s>]/i.test(b)).length;
  const withContentEncoded = items.filter(b => /<content:encoded/i.test(b)).length;
  const atomSelf = xml.match(/atom:link[^>]+href="([^"]+)"/)?.[1] || '';
  let imageOk = 0;
  let imageFail = 0;
  for (const block of items.slice(0, 5)) {
    const img = block.match(/enclosure url="([^"]+)"/)?.[1]
      || block.match(/<img[^>]+src="([^"]+)"/)?.[1];
    if (!img) continue;
    try {
      const head = await fetch(img, {
        method: 'HEAD',
        headers: { 'User-Agent': 'facebookexternalhit/1.1' },
      });
      if (head.ok && (head.headers.get('content-type') || '').includes('image')) imageOk++;
      else imageFail++;
    } catch {
      imageFail++;
    }
  }
  const link = sample.match(/<link>([^<]+)<\/link>/)?.[1];
  let ogImage = '';
  if (link) {
    try {
      const page = await fetch(link, { headers: { 'User-Agent': 'facebookexternalhit/1.1' } });
      const html = await page.text();
      ogImage = html.match(/property="og:image"[^>]+content="([^"]+)"/)?.[1]
        || html.match(/content="([^"]+)"[^>]+property="og:image"/)?.[1]
        || '';
    } catch { /* ignore */ }
  }
  const summary = {
    name,
    url,
    status: res.status,
    itemCount: items.length,
    withEnclosure,
    withImgInDesc,
    withContentEncoded,
    atomSelf,
    imageOk,
    imageFail,
    ogImagePresent: Boolean(ogImage),
  };
  console.log(JSON.stringify(summary, null, 2));
  // #region agent log
  debugLog('H1', `${name} feed shape`, summary);
  debugLog('H2', `${name} dlvr.it image signals`, {
    withImgInDesc,
    withEnclosure,
    withContentEncoded,
    imageOk,
    imageFail,
  });
  debugLog('H3', `${name} OG on newest`, { link, ogImagePresent: Boolean(ogImage) });
  // #endregion
  return summary;
}

async function main() {
  const ml = await checkFeed('malayalam', 'https://www.thebharathnews.com/feed/social-ml.xml');
  const en = await checkFeed('english', 'https://www.thebharathnews.com/feed/social-en.xml');

  let pipeline = {};
  try {
    const res = await fetch(`${WORKER}/api/pipeline-status?k=run7x9k`);
    pipeline = await res.json();
    const social = pipeline.social || {};
    console.log('\nPipeline:', {
      facebookMode: social.facebookMode,
      facebookDlvrFeedUrl: social.facebookDlvrFeedUrl,
      facebookGraphEnabled: social.facebookGraphEnabled,
      facebookTokenValid: social.facebookTokenValid,
    });
    // #region agent log
    debugLog('H4', 'pipeline status', {
      facebookMode: social.facebookMode,
      facebookDlvrFeedUrl: social.facebookDlvrFeedUrl,
      facebookGraphEnabled: social.facebookGraphEnabled,
      facebookTokenValid: social.facebookTokenValid,
      facebookTokenReason: social.facebookTokenStatus?.reason,
    });
    // #endregion
  } catch (e) {
    console.warn('pipeline-status failed:', e.message);
  }

  const needsDeploy = ml.withImgInDesc === 0 && ml.withContentEncoded === 0;
  if (needsDeploy) {
    console.log('\n⚠ Feed missing <img> in description — deploy latest site code, then re-run this script.');
    // #region agent log
    debugLog('H5', 'feed fix not deployed', { needsDeploy: true });
    // #endregion
  } else {
    console.log('\n✓ Feed has dlvr.it-friendly image tags in item body.');
    // #region agent log
    debugLog('H5', 'feed fix present', { mlImgInDesc: ml.withImgInDesc, mlContentEncoded: ml.withContentEncoded });
    // #endregion
  }

  if (pipeline.social?.facebookMode === 'dlvr_it') {
    console.log('\ndlvr.it checklist (manual):');
    console.log('  1. Malayalam route RSS = https://www.thebharathnews.com/feed/social-ml.xml');
    console.log('  2. English route RSS   = https://www.thebharathnews.com/feed/social-en.xml');
    console.log('  3. Route active, Post Newest First, 1 post/update, every 5 min');
    console.log('  4. Facebook page connected (re-auth if dlvr.it shows errors)');
    console.log('  5. If queue shows items but nothing posted → Reset Queue in dlvr.it');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
