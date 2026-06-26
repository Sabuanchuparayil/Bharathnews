#!/usr/bin/env node
/** Ingest + publish Malayalam articles (OG image at publish) for dlvr.it Facebook feed. */
const WORKER = process.env.WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev';

async function run() {
  const rounds = parseInt(process.argv[2], 10) || 5;
  let totalIngested = 0;
  let totalPublished = 0;

  const rq = await fetch(`${WORKER}/api/publish-malayalam?k=run7x9k&requeue=1`);
  const rqData = await rq.json();
  console.log(`Requeue: ${rqData.requeued || 0} → published ${rqData.published || 0}`);
  totalPublished += rqData.published || 0;

  for (let i = 0; i < rounds; i++) {
    const offset = i % 8;
    const res = await fetch(`${WORKER}/api/ingest-lang?k=run7x9k&lang=ml&offset=${offset}`);
    const data = await res.json();
    totalIngested += data.ingested || 0;
    totalPublished += data.published || 0;
    console.log(
      `Round ${i + 1}: ingested=${data.ingested} published=${data.published}`,
      (data.sourceNames || []).join(', '),
    );
    if (data.malayalam) {
      console.log('  malayalam:', data.malayalam);
    }
    if (data.errors?.length) {
      console.log('  errors:', data.errors);
    }
  }

  const feed = await fetch('https://www.thebharathnews.com/feed/social-ml.xml');
  const xml = await feed.text();
  const count = (xml.match(/<item>/g) || []).length;
  console.log(`\nTotals: ingested=${totalIngested} published=${totalPublished}`);
  console.log(`feed/social-ml.xml items: ${count}`);

  if (count >= 25 && totalIngested === 0) {
    console.log('\nStatus: HEALTHY — Malayalam feed is at capacity (25/25).');
    console.log('ingested=0 = all current RSS URLs are already in the database (no new Kerala stories yet).');
    console.log('published=0 after round 1 = Malayalam publish queue was drained.');
    console.log('dlvr.it will keep posting from: https://www.thebharathnews.com/feed/social-ml.xml');
  } else if (count === 0) {
    console.log('\nNote: publish requires a real OG image per article. Re-run in ~10 min as new Kerala stories appear.');
  } else if (totalPublished > 0) {
    console.log('\nStatus: OK — new Malayalam articles added to the social feed.');
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
