-- Phase 2: durable distribution queue + per-channel timestamps

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS facebook_posted_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS distribution_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('telegram', 'facebook')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'skipped')),
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (article_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_distribution_jobs_pending
  ON distribution_jobs (status, next_retry_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_distribution_jobs_channel
  ON distribution_jobs (channel, status);

ALTER TABLE distribution_jobs ENABLE ROW LEVEL SECURITY;
