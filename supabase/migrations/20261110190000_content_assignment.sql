ALTER TABLE articles ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_articles_assigned_to
  ON articles (assigned_to) WHERE assigned_to IS NOT NULL;

CREATE TABLE IF NOT EXISTS cowork_ingest_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  received_at TIMESTAMPTZ DEFAULT now(),
  article_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'cowork',
  details JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cowork_ingest_log_received
  ON cowork_ingest_log (received_at DESC);

ALTER TABLE cowork_ingest_log ENABLE ROW LEVEL SECURITY;
