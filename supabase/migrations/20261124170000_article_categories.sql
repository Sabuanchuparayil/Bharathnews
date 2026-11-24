-- A desk story can appear in more than one section.
-- category stays the first choice, for older pages.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS categories TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_articles_categories ON articles USING GIN (categories);
