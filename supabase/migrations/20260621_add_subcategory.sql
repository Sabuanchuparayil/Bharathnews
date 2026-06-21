-- Phase 2: Add subcategory column for interest-first taxonomy
-- Run in Supabase SQL Editor on existing projects

ALTER TABLE articles ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE raw_articles ADD COLUMN IF NOT EXISTS subcategory TEXT;

CREATE INDEX IF NOT EXISTS idx_articles_subcategory ON articles(subcategory) WHERE subcategory IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_category_subcategory ON articles(category, subcategory);
