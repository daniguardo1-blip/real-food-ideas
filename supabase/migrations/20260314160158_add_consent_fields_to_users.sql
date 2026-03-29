/*
  # Add consent fields to users table

  1. Changes
    - Add `consent_privacy` (boolean, default false) - Privacy policy consent
    - Add `consent_terms` (boolean, default false) - Terms of service consent
    - Add `consent_marketing` (boolean, default false) - Marketing consent
    - Add `consent_date` (timestamptz, nullable) - Date when consent was given
*/

-- Add consent fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'consent_privacy'
  ) THEN
    ALTER TABLE users ADD COLUMN consent_privacy boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'consent_terms'
  ) THEN
    ALTER TABLE users ADD COLUMN consent_terms boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'consent_marketing'
  ) THEN
    ALTER TABLE users ADD COLUMN consent_marketing boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'consent_date'
  ) THEN
    ALTER TABLE users ADD COLUMN consent_date timestamptz;
  END IF;
END $$;
