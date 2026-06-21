/**
 * Flush Telegram + Facebook backlog manually.
 * Usage: npm run distribute:now
 */
const WORKER = process.env.NEXT_PUBLIC_WORKER_URL || 'https://bharathnews-api.bharathnewsweb.workers.dev';

async function run(rounds = 10) {
  let totalTg = 0;
  let totalFb = 0;
  for (let i = 0; i < rounds; i++) {
    const url = `${WORKER}/api/distribute-now?k=run7x9k&telegram=3&facebook=0`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('Failed:', data);
      break;
    }
    totalTg += data.telegramSent || 0;
    totalFb += data.facebookSent || 0;
    console.log(`Round ${i + 1}: tg=${data.telegramSent} fb=${data.facebookSent} failed=${data.failed || 0}`, data.errors?.slice?.(0, 2) || '');
    if ((data.telegramSent || 0) === 0 && (data.facebookSent || 0) === 0) break;
    await new Promise(r => setTimeout(r, 4000));
  }
  console.log(`Done: ${totalTg} Telegram, ${totalFb} Facebook posts sent.`);
}

run().catch(err => { console.error(err); process.exit(1); });
