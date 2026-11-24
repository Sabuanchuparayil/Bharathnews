-- Desk lists filter by the newsroom source and a status, then the newest rows.
-- The older status-only index walks the whole published archive to find those rows.
CREATE INDEX IF NOT EXISTS idx_articles_desk_status
  ON articles (source, editorial_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_articles_desk_published
  ON articles (source, editorial_status, published_at DESC);
