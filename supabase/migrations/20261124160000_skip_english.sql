-- Selected desk stories can be published without an English version.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS skip_english BOOLEAN NOT NULL DEFAULT false;
