import { loadSiteSettings } from '../lib/sources-loader.js';
import { selectRows } from '../lib/supabase-rest.js';
import { enqueueDistributionJobs, processDistributionJobs } from '../lib/distribution-jobs.js';

export async function handleDistribute(env, articleId) {
  const settings = await loadSiteSettings(env);
  const rows = await selectRows(env, 'articles', { filters: { id: articleId }, limit: 1 });
  if (!rows.length) return;

  await enqueueDistributionJobs(env, rows[0], settings);
  await processDistributionJobs(env, { telegramBatch: 1, facebookBatch: 1 });
}
