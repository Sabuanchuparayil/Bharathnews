-- Selected English stories can be published without a Malayalam version.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS skip_malayalam BOOLEAN NOT NULL DEFAULT false;
