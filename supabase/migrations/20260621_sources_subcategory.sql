-- Add subcategory to sources table for feed-level taxonomy tags
ALTER TABLE sources ADD COLUMN IF NOT EXISTS subcategory TEXT;
