DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'staff_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE staff_profiles
      ADD CONSTRAINT staff_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_user_id
  ON staff_profiles (user_id) WHERE user_id IS NOT NULL;

ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS assigned_topics TEXT[] DEFAULT '{}';
