/*
  # Add Language Preference Column

  1. Changes
    - Add `preferred_language` column to profiles table
    - Set default value to 'en' for English

  2. Notes
    - Supports 7 languages: en, es, fr, de, it, pt, ru
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'en';
  END IF;
END $$;
