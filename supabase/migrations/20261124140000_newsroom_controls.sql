-- Newsroom controls: who did what, story versions, public corrections, and the contact inbox.

ALTER TABLE articles ADD COLUMN IF NOT EXISTS correction_note TEXT DEFAULT '';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS unpublished_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT DEFAULT '',
  detail JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events (created_at DESC);

CREATE TABLE IF NOT EXISTS article_revisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL,
  editor_id UUID,
  reason TEXT DEFAULT '',
  title TEXT,
  summary TEXT,
  full_content TEXT,
  editorial_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_revisions_article ON article_revisions (article_id, created_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT DEFAULT '',
  email TEXT DEFAULT '',
  topic TEXT DEFAULT 'general',
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages (status, created_at DESC);

CREATE TABLE IF NOT EXISTS article_referrers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID,
  host TEXT NOT NULL,
  hits INTEGER DEFAULT 1,
  day DATE DEFAULT CURRENT_DATE,
  UNIQUE (article_id, host, day)
);

CREATE INDEX IF NOT EXISTS idx_article_referrers_day ON article_referrers (day DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_referrers ENABLE ROW LEVEL SECURITY;
